import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  await mongoose.connect(env.mongoUrl, { dbName: env.dbName });
  console.log(`MongoDB connected: ${env.dbName}`);
}
export async function closeDatabase() { await mongoose.connection.close(); }