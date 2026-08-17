import mongoose from "mongoose";
const schema = new mongoose.Schema({ actor: String, action: String, entity: String, entityId: String, detail: String }, { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false });
export default mongoose.model("Activity", schema);