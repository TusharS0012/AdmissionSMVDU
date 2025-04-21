import { PrismaClient } from './prisma/generated/prisma/index.js';

const prisma = new PrismaClient();


async function allocateRound2SC() {
  const targetCategory = 'SC';
  const targetSubCategory = 'SCSC';
  const roundNumber = 2;

  // 1. Get all students belonging to the target category, ordered by category rank
  const students = await prisma.studentApplication.findMany({
    where: { category: targetCategory },
    orderBy: { categoryRank: 'asc' }, // Use categoryRank
    include: { allocatedSeat: true },
  });

  // 2. Get seat matrix for the target subcategory
  const seatMatrix = await prisma.seatMatrix.findMany({
    where: {
      category: targetCategory,
      subCategory: targetSubCategory,
      totalSeats: { gt: 0 },
    },
    include: { department: true },
  });

  const seatMap = new Map();
  const nameToDeptId = new Map();

  seatMatrix.forEach((seat) => {
    seatMap.set(seat.departmentId, seat.totalSeats);
    nameToDeptId.set(seat.department.name, seat.departmentId);
  });

  for (const student of students) {
    if (
      student.allocatedSeat &&
      student.allocatedSeat.allocatedCourse === student.courseChoice1
    ) {
      console.log(
        `${student.studentName} already got first choice, skipping...`
      );
      continue;
    }

    const choices = [
      student.courseChoice1,
      student.courseChoice2,
      student.courseChoice3,
      student.courseChoice4,
      student.courseChoice5,
      student.courseChoice6,
      student.courseChoice7,
    ].filter(Boolean);

    for (const courseName of choices) {
      const deptId = nameToDeptId.get(courseName);
      if (!deptId) continue;

      const available = seatMap.get(deptId);
      if (available && available > 0) {
        if (student.allocatedSeat) {
          const currentChoiceIndex = choices.indexOf(courseName);
          const previousChoiceIndex = choices.indexOf(
            student.allocatedSeat.allocatedCourse
          );

          if (currentChoiceIndex === -1 || currentChoiceIndex >= previousChoiceIndex) {
            console.log(
              `${student.studentName}'s current seat is better, skipping...`
            );
            break;
          }
        }

        await prisma.$transaction([
          prisma.allocatedSeat.create({
            data: {
              studentId: student.applicationNumber,
              allocatedCourse: courseName,
              allocationRound: roundNumber,
              allocatedAt: new Date(),
            },
          }),
          prisma.seatMatrix.update({
            where: {
              departmentId_category_subCategory: {
                departmentId: deptId,
                category: targetCategory,
                subCategory: targetSubCategory,
              },
            },
            data: { totalSeats: { decrement: 1 } },
          }),
        ]);

        console.log(
          `Allocated ${student.studentName} to ${courseName} in round ${roundNumber}`
        );
        break;
      }
    }
  }

  console.log(`Round ${roundNumber} ${targetCategory} allocation complete.`);
}

allocateRound2SC()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
