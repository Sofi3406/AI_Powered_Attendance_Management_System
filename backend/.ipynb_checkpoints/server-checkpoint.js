import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import attendanceRoutes from "./routes/attendance.js";
import employeeRoutes from "./routes/employees.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
