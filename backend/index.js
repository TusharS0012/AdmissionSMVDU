import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "./prisma/generated/prisma/index.js";

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/login", async (req, res) => {
  const { email, applicationNumber } = req.body;

  if (!email || !applicationNumber) {
    return res
      .status(400)
      .json({ message: "Email and application number required." });
  }

  try {
    const student = await prisma.studentApplication.findUnique({
      where: { applicationNumber },
    });

    if (!student || student.email !== email) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { applicationNumber: student.applicationNumber, email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; 
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Failed to authenticate token." });
    }
    req.user = decoded;
    next();
  });
};

app.post("/api/seat-allotment", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.applicationNumber;
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID from token." });
    }

    console.log("Fetching seat allotment for userId:", userId);

    const seatAllotment = await prisma.allocatedSeat.findFirst({
      where: { studentId: userId },
      include: {
        student: true,
      },
    });

    if (!seatAllotment) {
      return res.status(404).json({ message: "Seat allotment not found." });
    }

    const response = {
      candidateName: seatAllotment.student.studentName,
      round: seatAllotment.allocationRound,
      course: seatAllotment.allocatedCourse,
      institute: "SMVDU",
    };
    console.log(response);
    res.json(response);
  } catch (err) {
    console.error("Error fetching seat allotment:", err);
    res.status(500).json({
      message: "An error occurred while fetching the seat allotment.",
    });
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server up on port:${PORT}`);
});
