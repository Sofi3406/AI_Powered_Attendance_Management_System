import FormData from "form-data";
import fetch from "node-fetch";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";

const RECOGNITION_SERVICE_URL = process.env.RECOGNITION_SERVICE_URL || "http://localhost:8001";
const MATCH_TOLERANCE = process.env.MATCH_TOLERANCE || "0.6";

function todayParts() {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 8),
  };
}

export async function recognizeFrame(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "A frame image is required" });
    }

    const employees = await Employee.find({}, { rollNo: 1, name: 1, encodings: 1 });
    if (employees.length === 0) {
      return res.status(400).json({ error: "No registered employees yet" });
    }

    const database = employees.map((e) => ({
      rollNo: e.rollNo,
      name: e.name,
      encodings: e.encodings,
    }));

    const form = new FormData();
    form.append("file", req.file.buffer, { filename: "frame.jpg" });
    form.append("database", JSON.stringify(database));
    form.append("tolerance", MATCH_TOLERANCE);

    const response = await fetch(`${RECOGNITION_SERVICE_URL}/recognize`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.detail || "Recognition failed" });
    }

    const { date, time } = todayParts();
    const marked = [];

    for (const face of result.matches) {
      if (!face.match) continue;
      const { rollNo, name } = face.match;

      const existing = await Attendance.findOne({ date, rollNo });
      if (!existing) {
        await Attendance.create({ date, time, rollNo, name, status: "Present" });
        marked.push({ rollNo, name, status: "Present" });
      }
    }

    res.json({ facesDetected: result.faces_detected, matches: result.matches, marked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recognition failed", details: err.message });
  }
}

export async function markAbsentees(req, res) {
  const { date, time } = todayParts();

  const employees = await Employee.find({}, { rollNo: 1, name: 1 });
  const presentToday = await Attendance.find({ date }, { rollNo: 1 });
  const presentRollNos = new Set(presentToday.map((a) => a.rollNo));

  const marked = [];
  for (const emp of employees) {
    if (!presentRollNos.has(emp.rollNo)) {
      await Attendance.create({ date, time, rollNo: emp.rollNo, name: emp.name, status: "Absent" });
      marked.push({ rollNo: emp.rollNo, name: emp.name, status: "Absent" });
    }
  }

  res.json({ marked });
}

export async function getAttendance(req, res) {
  const { date } = req.query;
  const filter = date ? { date } : {};
  const records = await Attendance.find(filter).sort({ date: -1, time: -1 });
  res.json(records);
}

export async function getSummary(req, res) {
  const summary = await Attendance.aggregate([
    {
      $group: {
        _id: { rollNo: "$rollNo", name: "$name", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(summary);
}
