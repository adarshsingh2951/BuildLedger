import mongoose from "mongoose";
const schema = new mongoose.Schema({ siteName: { type: String, default: "North Block" }, siteCode: { type: String, default: "SITE 04" }, projectNote: { type: String, default: "" } }, { timestamps: true, versionKey: false });
export default mongoose.model("SiteSettings", schema);