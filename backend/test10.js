// import { PrismaClient } from './prisma/generated/prisma/index.js';
// import { allocateRound1GNGN } from './testGN.js';
// import { allocateRound2OBC } from './testOBC.js';
// import { allocateRound2EWS } from './testEWS.js';
// import { allocateRound2SC } from './testSC.js';
// import { allocateRound2ST1 } from './testST1.js';
// import { allocateRound2ST2 } from './testST2.js';
// import { allocateRound2RBA } from './testRBA.js';
// import { allocateRound2RLAC } from './testRLAC.js';
// import { checkSeatsRemaining } from './remseats.js';
// import { writeFileSync } from 'fs'; // For writing CSV
// import path from 'path'; // For proper file paths

// const prisma = new PrismaClient();

// async function finalAllotment() {
//     let round = 1;
//     try {
//         while (await checkSeatsRemaining()) {
//             console.log(`\n==== ROUND ${round} START ====\n`);

//             console.log('> General Category Allotment...');
//             await allocateRound1GNGN();

//             console.log('> OBC Category Allotment...');
//             await allocateRound2OBC();

//             console.log('> EWS Category Allotment...');
//             await allocateRound2EWS();

//             console.log('> SC Category Allotment...');
//             await allocateRound2SC();

//             console.log('> ST Category 1 Allotment...');
//             await allocateRound2ST1();

//             console.log('> ST Category 2 Allotment...');
//             await allocateRound2ST2();

//             console.log('> RBA Category Allotment...');
//             await allocateRound2RBA();

//             console.log('> RLAC Category Allotment...');
//             await allocateRound2RLAC();

//             console.log(`\n==== ROUND ${round} COMPLETE ====\n`);
//             round++;
//         }

//         console.log('\n🎯 All seats are fully allotted!');
//         await exportAllocatedSeatsToCSV();

//     } catch (error) {
//         console.error('❌ Error during final allotment:', error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// async function exportAllocatedSeatsToCSV() {
//     console.log('📄 Exporting allocated seats to CSV...');

//     try {
//         const students = await prisma.studentApplication.findMany({
//             where: {
//                 allocations: {
//                     some: {}
//                 }
//             },
//             include: {
//                 allocations: true
//             }
//         });

//         console.log(`🔍 Found ${students.length} students with allocations.`);

//         if (students.length === 0) {
//             console.warn('⚠️ No students to export.');
//             return;
//         }

//         // Prepare CSV header
//         const header = 'StudentID,Name,Email,Phone,Category,Department Allocated,Allocation Round\n';

//         // Prepare CSV rows
//         const rows = students.flatMap(student =>
//             student.allocations.map(allocation =>
//                 `${student.applicationNumber},"${student.studentName}","${student.email}",${student.phoneNumber},"${student.category}","${allocation.allocatedCourse}",${allocation.allocationRound}`
//             )
//         );

//         // Final CSV content
//         const csvContent = header + rows.join('\n');

//         // Path to store file
//         const filePath = path.resolve('final_allocation.csv');

//         // Write to file
//         writeFileSync(filePath, csvContent);

//         console.log(`✅ CSV file saved successfully at: ${filePath}`);
//     } catch (error) {
//         console.error('❌ Error exporting CSV:', error);
//     }
// }

// // Start the process
// finalAllotment();

import { PrismaClient } from './prisma/generated/prisma/index.js';
import { allocateRound1GNGN } from './testGN.js';
import { allocateRound2EWS } from './testEWS.js';
import { allocateRound2SC } from './testSC.js';
import { allocateRound2ST1 } from './testST1.js';
import { allocateRound2ST2 } from './testST2.js';
import { allocateRound2RBA } from './testRBA.js';
import { allocateRound2RLAC } from './testRLAC.js';
import { allocateRound2OBC } from './testOBC.js';
import { checkSeatsRemaining } from './remseats.js';
import { writeFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function finalAllotment() {
    let round = 1;
    let allocationComplete = false;
    let unallocatedStudents;

    try {
        //Initial fetch of all students
        const allStudents = await prisma.studentApplication.findMany({
            orderBy: { jeeCRL: 'asc' },
        });
        unallocatedStudents = [...allStudents]; // Initially, all are unallocated

        while (!allocationComplete) {
            console.log(`\n==== ROUND ${round} START ====\n`);

            console.log('> General Category Allotment...');
            const newlyAllocatedGNGN = await allocateRound1GNGN(unallocatedStudents, round);

            // Update unallocated students list
            unallocatedStudents = unallocatedStudents.filter(
                (student) => !newlyAllocatedGNGN.includes(student.applicationNumber)
            );

            console.log('> EWS Category Allotment...');
            await allocateRound2EWS();

            console.log('> SC Category Allotment...');
            await allocateRound2SC();

            console.log('> ST Category 1 Allotment...');
            await allocateRound2ST1();

            console.log('> ST Category 2 Allotment...');
            await allocateRound2ST2();

            console.log('> RBA Category Allotment...');
            await allocateRound2RBA();

            console.log('> RLAC Category Allotment...');
            await allocateRound2RLAC();

            console.log('> OBC Category Allotment...');
            await allocateRound2OBC();

            console.log(`\n==== ROUND ${round} COMPLETE ====\n`);

            //---  CHECK FOR COMPLETION  ---
            const allGNGNSeatsFilled = await areAllGNGNSeatsFilled();
            const allApplicationsProcessed = await areAllApplicationsProcessed();
            const noSeatsLeft = !(await checkSeatsRemaining());

            if (allGNGNSeatsFilled || allApplicationsProcessed || noSeatsLeft) {
                allocationComplete = true;
                console.log('\n🛑 Allocation stopping condition met.\n');
            } else {
                round++;
            }
        }

        console.log('\n🎯 Allocation process complete!');
        await exportAllocatedSeatsToCSV();

    } catch (error) {
        console.error('❌ Error during final allotment:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// --- Helper Functions ---
async function areAllApplicationsProcessed() {
    try {
        const allocatedStudentCount = await prisma.allocatedSeat.aggregate({
            _count: {
                studentId: { distinct: true },
            },
        });
        const numberOfUniqueStudents = allocatedStudentCount._count.studentId;
        const totalStudents = await prisma.studentApplication.count();
        return numberOfUniqueStudents === totalStudents;
    } catch (error) {
        console.error("Error in areAllApplicationsProcessed:", error);
        return false; // Or throw the error, depending on how you want to handle it
    }
}


async function areAllGNGNSeatsFilled() {
    const totalGNGNSeats = await prisma.seatMatrix.aggregate({
        _sum: {
            totalSeats: true,
        },
        where: {
            category: 'GEN',
            subCategory: 'GNGN',
        },
    });

    const remainingGNGNSeats = await prisma.seatMatrix.aggregate({
        _sum: {
            totalSeats: true,
        },
        where: {
            category: 'GEN',
            subCategory: 'GNGN',
            totalSeats: { gt: 0 },
        },
    });

    const totalSeats = totalGNGNSeats._sum.totalSeats || 0;
    const remainingSeats = remainingGNGNSeats._sum.totalSeats || 0;

    return totalSeats > 0 && remainingSeats === 0;
}

async function exportAllocatedSeatsToCSV() {
    console.log('📄 Exporting allocated seats to CSV...');

    try {
        const students = await prisma.studentApplication.findMany({
            where: {
                allocations: {
                    some: {}
                }
            },
            include: {
                allocations: true
            }
        });

        console.log(`🔍 Found ${students.length} students with allocations.`);

        if (students.length === 0) {
            console.warn('⚠️ No students to export.');
            return;
        }

        // Prepare CSV header
        const header = 'StudentID,Name,Email,Phone,Category,Department Allocated,Allocation Round\n';

        // Prepare CSV rows
        const rows = students.flatMap(student =>
            student.allocations.map(allocation =>
                `${student.applicationNumber},"${student.studentName}","${student.email}",${student.phoneNumber},"${student.category}","${allocation.allocatedCourse}",${allocation.allocationRound}`
            )
        );

        // Final CSV content
        const csvContent = header + rows.join('\n');

        // Path to store file
        const filePath = path.resolve('final_allocation.csv');

        // Write to file
        writeFileSync(filePath, csvContent);

        console.log(`✅ CSV file saved successfully at: ${filePath}`);
    } catch (error) {
        console.error('❌ Error exporting CSV:', error);
    }
}

// Start the process
finalAllotment();
