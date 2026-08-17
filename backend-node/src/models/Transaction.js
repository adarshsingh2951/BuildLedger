import mongoose from "mongoose";
const schema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  materialName: String,
  transactionType: { type: String, enum: ["Inbound", "Outbound"], required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  processedByName: String,
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });
export default mongoose.model("Transaction", schema);