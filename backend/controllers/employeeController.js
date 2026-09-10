import FormData from "form-data";
import fetch from "node-fetch";
import Employee from "../models/Employee.js";

const RECOGNITION_SERVICE_URL = process.env.RECOGNITION_SERVICE_URL || "http://localhost:8001";

export async function registerEmployee(req, res) {
  try {
    const { rollNo, name } = req.body;
    if (!rollNo || !name) {
      return res.status(400).json({ error: "rollNo and name are required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one photo is required" });
    }

    const form = new FormData();
    for (const file of req.files) {
      form.append("files", file.buffer, { filename: file.originalname || "photo.jpg" });
    }

    const response = await fetch(`${RECOGNITION_SERVICE_URL}/encode`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.detail || "Encoding failed" });
    }

    const employee = await Employee.findOneAndUpdate(
      { rollNo },
      { rollNo, name, encodings: result.encodings },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: `${name} registered with ${result.valid_count} face sample(s)`,
      rejected: result.rejected,
      employee: {
        rollNo: employee.rollNo,
        name: employee.name,
        sampleCount: employee.encodings.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
}

export async function listEmployees(req, res) {
  // Never send raw face encodings to the browser.
  const employees = await Employee.find({}, { encodings: 0 });
  res.json(employees);
}

export async function deleteEmployee(req, res) {
  await Employee.deleteOne({ rollNo: req.params.rollNo });
  res.json({ message: "Employee removed" });
}
