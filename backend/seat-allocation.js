import { PrismaClient } from "./prisma/generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Generic allocation function for any category, subCategory, and round number.
 *
 * @param {string} category 
 * @param {string} subCategory
 * @param {number} roundNumber 
 */
async function allocateSeats({ category, subCategory, roundNumber }) {
  console.log(
    `\n📢 Starting allocation for Category: ${category}, SubCategory: ${subCategory}, Round: ${roundNumber}`
  );

  // Fetch students of this category ordered by rank ascending
  const students = await prisma.studentApplication.findMany({
    where: { category },
    orderBy: { categoryRank: "asc" },
  });
  console.log(`Found ${students.length} ${category} students.`);

  // Fetch seat matrix with seats available in this category/subcategory
  const seatMatrix = await prisma.seatMatrix.findMany({
    where: {
      category,
      subCategory,
      totalSeats: { gt: 0 },
    },
    include: { department: true },
  });

  // Map departmentId -> seats available and departmentName -> departmentId
  const seatMap = new Map();
  const nameToDeptId = new Map();

  seatMatrix.forEach((seat) => {
    seatMap.set(seat.departmentId, seat.totalSeats);
    nameToDeptId.set(seat.department.name, seat.departmentId);
  });

  // Process each student
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

    // Get existing allocation if any for this student
    const existingAllocation = await prisma.allocatedSeat.findFirst({
      where: { studentId: student.applicationNumber },
    });

    for (
      let preferenceNumber = 0;
      preferenceNumber < choices.length;
      preferenceNumber++
    ) {
      const courseName = choices[preferenceNumber];
      const deptId = nameToDeptId.get(courseName);
      if (!deptId) continue;

      const available = seatMap.get(deptId);

      if (available && available > 0) {
        if (existingAllocation) {
          const previousChoiceIndex = choices.indexOf(
            existingAllocation.allocatedCourse
          );

          // If existing allocation is better or same, skip
          if (
            previousChoiceIndex !== -1 &&
            preferenceNumber >= previousChoiceIndex
          ) {
            console.log(
              `Skipping ${student.studentName}, current seat (${existingAllocation.allocatedCourse}) is better or same.`
            );
            break;
          } else {
            // Delete previous allocation & free seat
            await prisma.allocatedSeat.delete({
              where: { id: existingAllocation.id },
            });

            const previousDeptId = nameToDeptId.get(
              existingAllocation.allocatedCourse
            );
            if (previousDeptId) {
              seatMap.set(previousDeptId, seatMap.get(previousDeptId) + 1);
              await prisma.seatMatrix.update({
                where: {
                  departmentId_category_subCategory: {
                    departmentId: previousDeptId,
                    category,
                    subCategory,
                  },
                },
                data: { totalSeats: { increment: 1 } },
              });
            }

            console.log(
              `Upgraded ${student.studentName} from ${existingAllocation.allocatedCourse} to ${courseName}`
            );
          }
        }

        // Allocate new seat
        await prisma.allocatedSeat.create({
          data: {
            studentId: student.applicationNumber,
            allocatedCourse: courseName,
            allocationRound: roundNumber,
            preferenceNumber: preferenceNumber + 1,
            allocatedAt: new Date(),
          },
        });

        seatMap.set(deptId, available - 1);

        await prisma.seatMatrix.update({
          where: {
            departmentId_category_subCategory: {
              departmentId: deptId,
              category,
              subCategory,
            },
          },
          data: { totalSeats: { decrement: 1 } },
        });

        console.log(
          `✅ Allocated ${student.studentName} to ${courseName} (Preference #${
            preferenceNumber + 1
          })`
        );
        break; // move to next student after allocation
      }
    }
  }

  console.log(
    `✅ Allocation complete for Category: ${category}, Round: ${roundNumber}\n`
  );
}

export { allocateSeats };
