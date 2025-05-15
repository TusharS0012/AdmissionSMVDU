import { PrismaClient } from "./prisma/generated/prisma/index.js";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

async function main() {
  console.log("🔄 Cleaning up existing data...");
  await prisma.allocatedSeat.deleteMany();
  await prisma.seatMatrix.deleteMany();
  await prisma.originalSeatMatrix.deleteMany();
  await prisma.studentApplication.deleteMany();
  await prisma.department.deleteMany();

  console.log("📥 Reading CSV files...");
  const departments = await readCSV("./data/departments.csv");
  const seatMatrices = await readCSV("./data/seatMatrix.csv");
  const studentApplications = await readCSV("./data/studentApplications.csv");

  console.log("🛠 Inserting Departments...");
  for (const dept of departments) {
    await prisma.department.create({
      data: {
        id: dept.id,
        name: dept.name,
      },
    });
  }

  console.log("🪑 Inserting Seat Matrix & Original Seat Matrix...");
  for (const seat of seatMatrices) {
    const data = {
      departmentId: seat.departmentId,
      category: seat.category,
      subCategory: seat.subCategory,
      totalSeats: parseInt(seat.totalSeats),
    };

    await prisma.seatMatrix.create({ data });
    await prisma.originalSeatMatrix.create({ data });
  }

  console.log("👨‍🎓 Inserting Student Applications...");
  await prisma.studentApplication.createMany({
    data: studentApplications.map((student) => ({
      applicationNumber: student.applicationNumber,
      studentName: student.studentName,
      fatherMotherName: student.fatherMotherName,
      phoneNumber: student.phoneNumber,
      email: student.email,
      jeeCRL: parseInt(student.jeeCRL),
      category: student.category,
      subCategory: student.subCategory || null,
      categoryRank: student.categoryRank
        ? parseInt(student.categoryRank)
        : null,
      subCategoryRank: student.subCategoryRank
        ? parseInt(student.subCategoryRank)
        : null,

      courseChoice1: student.courseChoice1,
      courseChoice2: student.courseChoice2 || null,
      courseChoice3: student.courseChoice3 || null,
      courseChoice4: student.courseChoice4 || null,
      courseChoice5: student.courseChoice5 || null,
      courseChoice6: student.courseChoice6 || null,
      courseChoice7: student.courseChoice7 || null,
      sportsMarks: student.sportsMarks ? parseFloat(student.sportsMarks) : null,

      createdAt: new Date(),
    })),
  });

  console.log("✅ Seed data created from CSV!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
