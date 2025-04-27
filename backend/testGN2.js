// // testGN2.js - Rerun GNGN allocation for unallocated students

// import { PrismaClient } from './prisma/generated/prisma/index.js';

// const prisma = new PrismaClient();

// async function allocateRound1GNGNRemaining() {
//     const roundNumber = 3; // or 2 if this is your second GNGN round

//     // 1. Get all students who were NOT allocated a seat in previous rounds
//     const allocatedStudentIds = await prisma.allocatedSeat.findMany({
//         select: { studentId: true },
//         distinct: ['studentId']
//     });

//     const allocatedStudentIdSet = new Set(allocatedStudentIds.map(a => a.studentId));

//     const students = await prisma.studentApplication.findMany({
//         where: {
//             applicationNumber: { notIn: Array.from(allocatedStudentIdSet) },
//             category: 'GEN'
//         },
//         orderBy: {
//             jeeCRL: 'asc',
//         },
//     });

//     // 2. Get GEN/GNGN seat matrix with available seats
//     const seatMatrix = await prisma.seatMatrix.findMany({
//         where: {
//             category: 'GEN',
//             subCategory: 'GEN',
//             totalSeats: {
//                 gt: 0,
//             },
//         },
//         include: {
//             department: true,
//         },
//     });

//     // 3. Map course name to departmentId and seats
//     const seatMap = new Map(); // departmentId => available seats
//     const nameToDeptId = new Map(); // courseName => departmentId

//     seatMatrix.forEach(seat => {
//         seatMap.set(seat.departmentId, seat.totalSeats);
//         nameToDeptId.set(seat.department.name, seat.departmentId);
//     });

//     // 4. Allocate seats
//     for (const student of students) {
//         const choices = [
//             student.courseChoice1,
//             student.courseChoice2,
//             student.courseChoice3,
//             student.courseChoice4,
//             student.courseChoice5,
//             student.courseChoice6,
//             student.courseChoice7,
//         ].filter(Boolean);

//         for (const courseName of choices) {
//             const deptId = nameToDeptId.get(courseName);
//             if (!deptId) continue;

//             const available = seatMap.get(deptId);

//             if (available && available > 0) {
//                 // Allocate seat
//                 await prisma.allocatedSeat.create({
//                     data: {
//                         studentId: student.applicationNumber,
//                         allocatedCourse: courseName,
//                         allocationRound: roundNumber,
//                         allocatedAt: new Date(),
//                     },
//                 });

//                 // Update in-memory
//                 seatMap.set(deptId, available - 1);

//                 // Update DB seatMatrix
//                 await prisma.seatMatrix.update({
//                     where: {
//                         departmentId_category_subCategory: {
//                             departmentId: deptId,
//                             category: 'GEN',
//                             subCategory: 'GEN',
//                         },
//                     },
//                     data: {
//                         totalSeats: { decrement: 1 },
//                     },
//                 });

//                 console.log(`Allocated ${student.studentName} to ${courseName}`);
//                 break;
//             }
//         }
//     }

//     console.log('Re-run GNGN allocation complete for unallocated students.');
// }

// allocateRound1GNGNRemaining()
//     .catch((e) => {
//         console.error(e);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });


//     async function verifyAllocationCounts() {
//     const totalAllocated = await prisma.allocatedSeat.count();
//     console.log(`Total number of allocated seats: ${totalAllocated}`);

//     const allocatedByCat = await prisma.studentApplication.groupBy({
//         by: ['category'],
//         _count: { applicationNumber: true }
//     })

//     allocatedByCat.forEach(cat => console.log(`Category ${cat.category} got ${cat._count.applicationNumber}`))
// }

// async function verifySeatMatrixConsistency() {
//     const seatMatrix = await prisma.seatMatrix.findMany();
//     for (const seat of seatMatrix) {
//         console.log(`Department: ${seat.departmentId}, Category: ${seat.category}, SubCategory: ${seat.subCategory}, Total Seats: ${seat.totalSeats}`);
//         if (seat.totalSeats < 0) {
//             console.error(`ERROR: Over-allocation detected in ${seat.departmentId} ${seat.category} ${seat.subCategory}`);
//         }
//     }
// }

// async function verifyStudentAllocation(applicationNumber) {
//     const student = await prisma.studentApplication.findUnique({
//         where: { applicationNumber: applicationNumber },
//         include: { allocatedSeat: true }
//     });

//     console.log(`Verifying Allocation for ${student.studentName} (App No: ${student.applicationNumber})`);

//     if (student.allocatedSeat) {
//         console.log(`Allocated to: ${student.allocatedSeat.allocatedCourse}, Round: ${student.allocatedSeat.allocationRound}`);
//         console.log(`Course choices were : Choice 1: ${student.courseChoice1}, Choice 2: ${student.courseChoice2},`)
//     } else {
//         console.log('Not allocated any seat.');
//     }
// }
// //Add this at the end of your test file before the finally
//     // Verification steps
//     await verifyAllocationCounts();
//     await verifySeatMatrixConsistency();
//     await verifyStudentAllocation('APP006'); //Checking for EWS student Neha
