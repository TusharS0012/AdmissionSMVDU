const { PrismaClient } = require('./prisma/generated/prisma');
const prisma = new PrismaClient();

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
        totalSeats: 10,
      },
      {
        departmentId: csDepartment.id,
        category: 'OBC',
        subCategory: 'OBCCL',
        totalSeats: 5,
      },
      {
        departmentId: meDepartment.id,
        category: 'GEN',
        subCategory: 'GNGN',
        totalSeats: 1,
      },
      {
        departmentId: meDepartment.id,
        category: 'OBC',
        subCategory: 'OBCCL',
        totalSeats: 4,
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
        jeeCRL: 5000,
        category: 'General',
        categoryRank: 100,
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
        jeeCRL: 15000,
        category: 'OBC',
        categoryRank: 50,
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
        jeeCRL: 8000,
        category: 'General',
        categoryRank: 200,
        courseChoice1: 'Mechanical Engineering',
        courseChoice2: 'Computer Science',
        createdAt: new Date(),
      },
    ],
  });

  console.log('✅ Seed data created!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
