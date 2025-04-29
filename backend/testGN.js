// import { PrismaClient } from './prisma/generated/prisma/index.js';

// const prisma = new PrismaClient();


// async function allocateRound1GNGN() {
//   // 1. Get all students regardless of category
//   const students = await prisma.studentApplication.findMany({
//     orderBy: {
//       jeeCRL: 'asc',
//     },
//   });

//   // 2. Get GEN/GNGN seat matrix
//   const seatMatrix = await prisma.seatMatrix.findMany({
//     where: {
//       category: 'GEN',
//       subCategory: 'GNGN',
//       totalSeats: {
//         gt: 0,
//       },
//     },
//     include: {
//       department: true,
//     },
//   });

//   // 3. Map course name to departmentId and seats
//   const seatMap = new Map(); // departmentId => available seats
//   const nameToDeptId = new Map(); // courseName => departmentId

//   // 3. Map course departmentId directly
// seatMatrix.forEach(seat => {
//   seatMap.set(seat.departmentId, seat.totalSeats);
//   nameToDeptId.set(seat.department.id, seat.departmentId); // ✅ map id, not name
// });


//   // 4. Allocate students
//   for (const student of students) {
//     const choices = [
//       student.courseChoice1,
//       student.courseChoice2,
//       student.courseChoice3,
//       student.courseChoice4,
//       student.courseChoice5,
//       student.courseChoice6,
//       student.courseChoice7,
//     ].filter(Boolean);

//     for (const courseName of choices) {
//       const deptId = nameToDeptId.get(courseName);
//       const available = seatMap.get(deptId);

//       if (available && available > 0) {
//         // Allocate seat
//         await prisma.allocatedSeat.create({
//           data: {
//             studentId: student.applicationNumber,
//             allocatedCourse: courseName,
//             allocationRound: 1,
//             allocatedAt: new Date(),
//           },
//         });

//         // Update in-memory
//         seatMap.set(deptId, available - 1);

//         // Update DB seatMatrix
//         await prisma.seatMatrix.update({
//           where: {
//             departmentId_category_subCategory: {
//               departmentId: deptId,
//               category: 'GEN',
//               subCategory: 'GNGN',
//             },
//           },
//           data: {
//             totalSeats: { decrement: 1 },
//           },
//         });

//         console.log(`Allocated ${student.studentName} to ${courseName}`);
//         break;
//       }
//     }
//   }

//   console.log('Round 1 GNGN allocation complete.');
// }

// allocateRound1GNGN()
//   .catch((e) => {
//     console.error(e);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

//   export { allocateRound1GNGN };

// Modified testGN.js

import { PrismaClient } from './prisma/generated/prisma/index.js';

const prisma = new PrismaClient();

async function allocateRound1GNGN(students, round) { // Added 'students' parameter
    if (!students) {
        students = await prisma.studentApplication.findMany({
            orderBy: { jeeCRL: 'asc' },
        });
    }

    const seatMatrix = await prisma.seatMatrix.findMany({
        where: {
            category: 'GEN',
            subCategory: 'GNGN',
            totalSeats: { gt: 0 },
        },
        include: {
            department: true,
        },
    });

    const seatMap = new Map();
    const nameToDeptId = new Map();

    seatMatrix.forEach(seat => {
        seatMap.set(seat.departmentId, seat.totalSeats);
        nameToDeptId.set(seat.department.id, seat.departmentId);
    });

    const newlyAllocatedStudentIds = []; // Track new allocations

    for (const student of students) {
        // Check if student is already allocated
        const existingAllocation = await prisma.allocatedSeat.findFirst({
            where: { studentId: student.applicationNumber },
        });
        if (existingAllocation) {
            continue; // Skip already allocated students
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
            const available = seatMap.get(deptId);

            if (available && available > 0) {
                await prisma.allocatedSeat.create({
                    data: {
                        studentId: student.applicationNumber,
                        allocatedCourse: courseName,
                        allocationRound: round, // Use the passed-in round
                        allocatedAt: new Date(),
                    },
                });

                seatMap.set(deptId, available - 1);
                await prisma.seatMatrix.update({
                  where: {
                    departmentId_category_subCategory: {
                      departmentId: deptId,
                      category: 'GEN',  
                      subCategory: 'GNGN',
                    },
                  },
                  data: {
                    totalSeats: { 
                      increment: -1  
                    },
                  },
                });

                console.log(`Allocated ${student.studentName} to ${courseName}`);
                newlyAllocatedStudentIds.push(student.applicationNumber);
                break;
            }
        }
    }

    console.log('Round 1 GNGN allocation complete.');
    return newlyAllocatedStudentIds; // Return newly allocated students
}

// (Remove the direct call to allocateRound1GNGN() here)
export { allocateRound1GNGN };