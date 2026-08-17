import mongoose from "mongoose";

const requiredMaterialSchema = new mongoose.Schema(
  {
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
    materialName: { type: String, required: true },
    unit: String,
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    taskName: { type: String, required: true, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedName: String,
    engineers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    workers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requiredMaterials: [requiredMaterialSchema],
    expectedDays: { type: Number, min: 0, default: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Task", schema);