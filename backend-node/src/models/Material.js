import mongoose from "mongoose";
const schema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  priorityTag: { type: String, enum: ["A", "B", "C"], required: true },
  unit: { type: String, required: true }, currentStock: { type: Number, default: 0, min: 0 },
  minimumThreshold: { type: Number, required: true, min: 0 }
}, { timestamps: true, versionKey: false });
export default mongoose.model("Material", schema);