import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:MM:SS"
    rollNo: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true },
  },
  { timestamps: true }
);

// One attendance record per person per day, enforced at the database level.
attendanceSchema.index({ date: 1, rollNo: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
