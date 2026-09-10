import { Router } from "express";
import multer from "multer";
import {
  recognizeFrame,
  markAbsentees,
  getAttendance,
  getSummary,
} from "../controllers/attendanceController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/recognize", upload.single("frame"), recognizeFrame);
router.post("/mark-absentees", markAbsentees);
router.get("/", getAttendance);
router.get("/summary", getSummary);

export default router;
