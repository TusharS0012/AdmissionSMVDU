import { PrismaClient } from './prisma/generated/prisma/index.js';
import fs from 'fs';

const prisma = new PrismaClient();

// Function to export allocation data to CSV
async function exportAllocationToCSV(allocationData) {
  const filePath = './allocation_export.csv';
  const headers = ['applicationNumber', 'studentName', 'allocatedDepartment', 'allocatedCategory', 'allocatedSeat'];

  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(headers.join(',') + '\n');

  allocationData.forEach(row => {
    writeStream.write(
      `${row.applicationNumber},${row.studentName},${row.allocatedDepartment},${row.allocatedCategory},${row.allocatedSeat}\n`
    );
  });

  writeStream.end();
  console.log('Allocation data exported to allocation_export.csv');
}

// Main function to handle allocation
async function allocateSeats() {
  // Fetch all student applications and seat matrix from the database
  const students = await prisma.studentApplication.findMany();
  const seatMatrix = await prisma.seatMatrix.findMany();

  // Prepare allocation results
  const allocationResults = [];

  // Fetch all departments to create a map of department names to IDs
  const departments = await prisma.department.findMany();
  const departmentMap = departments.reduce((map, dept) => {
    map[dept.name] = dept.id;
    return map;
  }, {});

  // For each student, check their course choices and allocate seats based on available seats
  for (const student of students) {
    let allocated = false;
    for (const courseChoice of [student.courseChoice1, student.courseChoice2]) {
      const departmentId = departmentMap[courseChoice];
      
      // If departmentId is not found, skip the allocation
      if (!departmentId) {
        continue;
      }

      // Check available seats in the department for the student's category
      const seat = seatMatrix.find(
        (s) => s.departmentId === departmentId && s.category === student.category && s.totalSeats > 0
      );

      if (seat) {
        // Allocate seat
        await prisma.seatMatrix.update({
          where: { id: seat.id },
          data: { totalSeats: seat.totalSeats - 1 }, // Decrease the available seats
        });

        allocationResults.push({
          applicationNumber: student.applicationNumber,
          studentName: student.studentName,
          allocatedDepartment: courseChoice,
          allocatedCategory: student.category,
          allocatedSeat: seat.subCategory,
        });

        allocated = true;
        break; // Once allocated, break out of the loop
      }
    }

    if (!allocated) {
      allocationResults.push({
        applicationNumber: student.applicationNumber,
        studentName: student.studentName,
        allocatedDepartment: 'None',
        allocatedCategory: student.category,
        allocatedSeat: 'None',
      });
    }
  }

  // Export the allocation results to CSV
  await exportAllocationToCSV(allocationResults);
  console.log('Seat allocation complete!');
}

allocateSeats()
  .catch((e) => {
    console.error('Error during allocation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
