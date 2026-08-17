import Material from "../models/Material.js";
import Task from "../models/Task.js";
import Transaction from "../models/Transaction.js";
import { publicUser } from "../services/authService.js";
export async function dashboard(req, res) { const [materials, tasks, transactions, movements] = await Promise.all([Material.find().lean(), Task.find().sort({ createdAt: -1 }).limit(20).lean(), Transaction.find().sort({ timestamp: -1 }).limit(12).lean(), Transaction.countDocuments()]); res.json({ user: publicUser(req.user), materials, tasks, transactions, metrics: { materials: materials.length, lowStock: materials.filter((m) => m.currentStock <= m.minimumThreshold).length, openTasks: tasks.filter((t) => t.status !== "Completed").length, movements } }); }
export function yoloStatus(req, res) { res.json({ active: false, message: "YOLOv5 material counting is planned for a future integration." }); }