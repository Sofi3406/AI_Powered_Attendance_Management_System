import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    // One 128-value array per valid registration photo.
    encodings: { type: [[Number]], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
