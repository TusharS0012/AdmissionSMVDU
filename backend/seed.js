import { PrismaClient } from './prisma/generated/prisma/index.js';

const prisma = new PrismaClient();

await prisma.allocatedSeat.deleteMany();
await prisma.seatMatrix.deleteMany();
await prisma.studentApplication.deleteMany();
await prisma.department.deleteMany();

async function main() {
  // Create Departments
  const csDepartment = await prisma.department.create({
    data: {
      id: 'cs',
      name: 'Computer Science',
    },
  });

  const meDepartment = await prisma.department.create({
    data: {
      id: 'me',
      name: 'Mechanical Engineering',
    },
  });

  // Create Seat Matrix for Departments
  await prisma.seatMatrix.createMany({
    data: [
      {
        departmentId: csDepartment.id,
        category: 'GEN',
        subCategory: 'GNGN',
        totalSeats: 1,
      },
      {
        departmentId: csDepartment.id,
        category: 'OBC',
        subCategory: 'OBC',
        totalSeats: 1,
      },
      {
        departmentId: csDepartment.id,
        category: 'EWS',
        subCategory: 'EWS',
        totalSeats: 1,
      },
      {
        departmentId: meDepartment.id,
        category: 'GEN',
        subCategory: 'GNGN',
        totalSeats: 0,
      },
      {
        departmentId: meDepartment.id,
        category: 'OBC',
        subCategory: 'OBC',
        totalSeats: 1,
      },
      {
        departmentId: meDepartment.id,
        category: 'EWS',
        subCategory: 'EWS',
        totalSeats: 1,
      },
    ],
  });

  // Create Student Applications
  await prisma.studentApplication.createMany({
    data: [
      {
        applicationNumber: 'APP001',
        studentName: 'John Doe',
        fatherMotherName: 'Michael Doe, Sarah Doe',
        phoneNumber: '1234567890',
        email: 'john.doe@example.com',
        jeeCRL: 100,
        category: 'GEN',
        categoryRank: 0,
        courseChoice1: 'Computer Science',
        courseChoice2: 'Mechanical Engineering',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP002',
        studentName: 'Jane Smith',
        fatherMotherName: 'Robert Smith, Emily Smith',
        phoneNumber: '9876543210',
        email: 'jane.smith@example.com',
        jeeCRL: 150,
        category: 'OBC',
        categoryRank: 20,
        courseChoice1: 'Mechanical Engineering',
        courseChoice2: 'Computer Science',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP003',
        studentName: 'Sam Wilson',
        fatherMotherName: 'David Wilson, Helen Wilson',
        phoneNumber: '5555555555',
        email: 'sam.wilson@example.com',
        jeeCRL: 200,
        category: 'OBC',
        categoryRank: 35,
        courseChoice1: 'Mechanical Engineering',
        courseChoice2: 'Computer Science',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP004',
        studentName: 'Emily Chen',
        fatherMotherName: 'David Wilson, Helen Wilson',
        phoneNumber: '5555555555',
        email: 'sam.wilson@example.com',
        jeeCRL: 180,
        category: 'EWS',
        categoryRank: 200,
        courseChoice1: 'Computer Science',
        courseChoice2: 'Mechanical Engineering',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP005',
        studentName: 'Ali Khan',
        fatherMotherName: 'David Wilson, Helen Wilson',
        phoneNumber: '5555555555',
        email: 'sam.wilson@example.com',
        jeeCRL: 300,
        category: 'OBC',
        categoryRank: 55,
        courseChoice1: 'Mechanical Engineering',
        courseChoice2: 'Computer Science',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP006',
        studentName: 'Neha Verma',
        fatherMotherName: 'David Wilson, Helen Wilson',
        phoneNumber: '5555555555',
        email: 'sam.wilson@example.com',
        jeeCRL: 25,
        category: 'EWS',
        categoryRank: 30,
        courseChoice1: 'Mechanical Engineering',
        courseChoice2: 'Computer Science',
        createdAt: new Date(),
      },
      {
        applicationNumber: 'APP007',
        studentName: 'Riya',
        fatherMotherName: 'David Wilson, Helen Wilson',
        phoneNumber: '5555555555',
        email: 'sam.wilson@example.com',
        jeeCRL: 80,
        category: 'GEN',
        categoryRank: 0,
        courseChoice1: 'Computer Science',
        courseChoice2: 'Mechanical Engineering',
        createdAt: new Date(),
      },
    ],
  });

  console.log(' Seed data created!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });