import { PrismaClient } from "./prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Generic allocation function for any category and round number.
 *
 * @param {string} category
 * @param {number} roundNumber
 */
async function allocateSeats({ category, roundNumber }) {
  console.log(
    `\n📢 Starting allocation for Category: ${category}, Round: ${roundNumber}`
  );

  // Fetch students of this category ordered by rank ascending
  const students = await prisma.StudentApplication.findMany({
    where: { category },
    orderBy: { categoryRank: "asc" },
  });
  console.log(`Found ${students.length} ${category} students.`);

  // Fetch seat matrix with seats available in this category
  const seatMatrix = await prisma.seatMatrix.findMany({
    where: {
      category,
      totalSeats: { gt: 0 },
    },
    include: { department: true },
  });

  // Map deptId -> seatsLeft and deptName -> deptId
  const seatMap = new Map();
  const nameToDeptId = new Map();
  seatMatrix.forEach((seat) => {
    seatMap.set(seat.departmentId, seat.totalSeats);
    nameToDeptId.set(seat.department.name, seat.departmentId);
  });

  for (const student of students) {
    const choices = [
      student.courseChoice1,
      student.courseChoice2,
      student.courseChoice3,
      student.courseChoice4,
      student.courseChoice5,
      student.courseChoice6,
      student.courseChoice7,
    ].filter(Boolean);

    const existing = await prisma.allocatedSeat.findFirst({
      where: { studentId: student.applicationNumber },
    });

    for (let i = 0; i < choices.length; i++) {
      const courseName = choices[i];
      const deptId = nameToDeptId.get(courseName);
      if (!deptId) continue;

      const available = seatMap.get(deptId);
      if (available > 0) {
        if (existing) {
          const prevIdx = choices.indexOf(existing.allocatedCourse);
          if (prevIdx !== -1 && i >= prevIdx) {
            console.log(
              `Skipping ${student.studentName}: existing seat is better or same`
            );
            break;
          }
          // free previous
          await prisma.allocatedSeat.delete({ where: { id: existing.id } });
          seatMap.set(
            nameToDeptId.get(existing.allocatedCourse),
            seatMap.get(nameToDeptId.get(existing.allocatedCourse)) + 1
          );
          await prisma.seatMatrix.update({
            where: {
              id: seatMatrix.find(
                (s) =>
                  s.departmentId === nameToDeptId.get(existing.allocatedCourse)
              ).id,
            },
            data: { totalSeats: { increment: 1 } },
          });
        }

        // create new
        await prisma.allocatedSeat.create({
          data: {
            studentId: student.applicationNumber,
            allocatedCourse: courseName,
            allocationRound: roundNumber,
            preferenceNumber: i + 1,
            allocatedAt: new Date(),
          },
        });

        seatMap.set(deptId, available - 1);
        await prisma.seatMatrix.update({
          where: { id: seatMatrix.find((s) => s.departmentId === deptId).id },
          data: { totalSeats: { decrement: 1 } },
        });

        console.log(
          `✅ Allocated ${student.studentName} to ${courseName} (Pref ${i + 1})`
        );
        break;
      }
    }
  }

  console.log(
    `✅ Allocation complete for Category: ${category}, Round: ${roundNumber}\n`
  );
}

export { allocateSeats };
