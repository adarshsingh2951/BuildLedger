import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["Admin", "Storekeeper", "Engineer","Worker"], default: "Engineer" },
  active: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });
export default mongoose.model("User", schema);