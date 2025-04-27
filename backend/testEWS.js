// test4.js - EWS Allocation (Revised)

import { PrismaClient } from './prisma/generated/prisma/index.js';

const prisma = new PrismaClient();

async function allocateRound2EWS() {
  const targetCategory = 'EWS';
  const targetSubCategory = 'EWS'; // Corrected subcategory
  const roundNumber = 2;

  const students = await prisma.studentApplication.findMany({
    where: { category: targetCategory },
    orderBy: { categoryRank: 'asc' },
  });

  const ewsSeatCounts = {
    'Computer Science': 1,
    'Electronics and Communication Engineering': 2,
    'Electrical Engineering': 2,
    'Mechanical Engineering': 1,
    'Manufacturing Engineering': 2,
    'Architecture': 0,
    'Design': 1,
    'Biotechnology': 1,
    'AI/Robotics': 1,
  };

  const seatMap = new Map(); // departmentId => available seats
  const nameToDeptId = new Map(); // courseName => departmentId

  // 2. Get seat matrix for EWS seats
  const seatMatrix = await prisma.seatMatrix.findMany({
    where: {
      category: targetCategory,
      subCategory: targetSubCategory,
      totalSeats: {
        gt: 0,
      },
    },
    include: {
      department: true,
    },
  });

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

    for (const courseName of choices) {
      const deptId = nameToDeptId.get(courseName);
      if (!deptId) continue;

      const available = seatMap.get(deptId);

      if (available && available > 0) {
        // Check if student already has an allocated seat
        const existingAllocation = await prisma.allocatedSeat.findFirst({
          where: {
            studentId: student.applicationNumber,
          },
        });

        if (existingAllocation) {
          // Student already has a seat, check if the current course is a better choice
          const currentChoiceIndex = choices.indexOf(courseName);
          const previousChoiceIndex = choices.indexOf(existingAllocation.allocatedCourse);

          if (currentChoiceIndex === -1 || currentChoiceIndex >= previousChoiceIndex) {
            // Current seat is not a better choice, skip to the next student
            console.log(`${student.studentName}'s current seat is better, skipping...`);
            break;
          } else {
            // Current seat is a better choice, delete the old allocation and create the new one
            await prisma.allocatedSeat.delete({
              where: {
                id: existingAllocation.id // Assuming you have an ID field
              }
            });

             const previousDeptId = nameToDeptId.get(existingAllocation.allocatedCourse);
            seatMap.set(previousDeptId, seatMap.get(previousDeptId) + 1);

            // Update in-memory and database seatMatrix for previous allocation
            await prisma.seatMatrix.update({
              where: {
                departmentId_category_subCategory: {
                  departmentId: previousDeptId,
                  category: targetCategory,
                  subCategory: targetSubCategory,
                },
              },
              data: {
                totalSeats: { increment: 1 },
              },
            });
          }
        }

        // Allocate seat
        await prisma.allocatedSeat.create({
          data: {
            studentId: student.applicationNumber,
            allocatedCourse: courseName,
            allocationRound: roundNumber,
            allocatedAt: new Date(),
          },
        });

        // Update in-memory
        seatMap.set(deptId, available - 1);

        // Update DB seatMatrix
        await prisma.seatMatrix.update({
          where: {
            departmentId_category_subCategory: {
              departmentId: deptId,
              category: targetCategory,
              subCategory: targetSubCategory,
            },
          },
          data: {
            totalSeats: { decrement: 1 },
          },
        });

        console.log(`Allocated ${student.studentName} to ${courseName}`);
        break;
      }
    }
  }

  console.log('Round 2 EWS allocation complete.');
}

allocateRound2EWS()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
