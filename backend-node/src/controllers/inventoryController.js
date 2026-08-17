import Material from "../models/Material.js";
import Task from "../models/Task.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
  parse,
  materialSchema,
  taskSchema,
  transactionSchema,
  taskUpdateSchema,
  taskMemberSchema,
} from "../schemas/common.js";
import { applyStock } from "../services/stockService.js";
import { logActivity } from "../services/activityService.js";
import mongoose from "mongoose";

const clean = (doc) => {
  const value = doc.toObject ? doc.toObject() : doc;
  return { ...value, id: value._id?.toString(), _id: undefined };
};

export async function listMaterials(req, res) {
  const { search = "", priorityTag, lowStock } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { sku: new RegExp(search, "i") },
    ];
  }

  if (["A", "B", "C"].includes(priorityTag)) {
    query.priorityTag = priorityTag;
  }

  if (lowStock === "true") {
    query.$expr = { $lte: ["$currentStock", "$minimumThreshold"] };
  }

  const materials = await Material.find(query).sort({ name: 1 }).limit(100);
  res.json(materials.map(clean));
}

export async function createMaterial(req, res) {
  const data = parse(materialSchema, req.body);
  const material = await Material.create(data);
  
  await logActivity(req.user, "created", "material", material.id, material.name);
  
  res.status(201).json(clean(material));
}

export async function updateMaterial(req, res) {
  const data = parse(materialSchema, req.body);
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    return res.status(404).json({ detail: "Material not found" });
  }
  
  Object.assign(material, data);
  await material.save();
  
  res.json({ message: "Material updated" });
}

async function utilisedForTask(taskId) {
  const rows = await Transaction.aggregate([
    { $match: { relatedTask: new mongoose.Types.ObjectId(taskId), transactionType: "Outbound" } },
    { $group: { _id: "$materialId", used: { $sum: "$quantity" }, materialName: { $first: "$materialName" } } },
  ]);
  return rows.map((row) => ({
    materialId: row._id.toString(),
    materialName: row.materialName,
    used: row.used,
  }));
}

export async function deleteMaterial(req, res) {
  const material = await Material.findByIdAndDelete(req.params.id);
  
  if (!material) {
    return res.status(404).json({ detail: "Material not found" });
  }
  
  res.json({ message: "Material removed" });
}

function canEditTask(user, task) {
  if (user.role === "Admin" || user.role === "Storekeeper") return true;
  return task.engineers.some((id) => id.toString() === user.id);
}

export async function listTasks(req, res) {
  const uid = req.user.id;
  const scoped = req.user.role === "Engineer" || req.user.role === "Worker";
  const query = scoped
    ? { $or: [{ assignedTo: uid }, { engineers: uid }, { workers: uid }] }
    : {};
  res.json((await Task.find(query).sort({ createdAt: -1 })).map(clean));
}

export async function createTask(req, res) {
  const data = parse(taskSchema, req.body);
  const assignee = await User.findOne({
     _id: data.assignedTo,
    active: { $ne: false } });

  if (!assignee) return res.status(404).json({ detail: "Assigned user not found" });
  const task = await Task.create({
    ...data,
    assignedName: assignee.name,
    engineers: assignee.role === "Engineer" ? [assignee._id] : [],
    workers: assignee.role === "Worker" ? [assignee._id] : [],
  });
  await logActivity(req.user, "created", "task", task.id, task.taskName);
  res.status(201).json(clean(task));
}

export async function getTaskDetail(req, res) {
  const task = await Task.findById(req.params.id)
    .populate("engineers", "name email role")
    .populate("workers", "name email role");
  if (!task) return res.status(404).json({ detail: "Task not found" });
  const used = await utilisedForTask(task._id);
  const utilised = task.requiredMaterials.map((row) => {
    const hit = used.find((u) => u.materialId === row.materialId.toString());
    return {
      materialId: row.materialId.toString(),
      materialName: row.materialName,
      unit: row.unit,
      required: row.quantity,
      used: hit?.used || 0,
    };
  });
  const extras = used.filter(
    (u) => !task.requiredMaterials.some((r) => r.materialId.toString() === u.materialId)
  );
  const value = task.toObject();
  res.json({
    ...value,
    id: value._id.toString(),
    _id: undefined,
    utilised: [
      ...utilised,
      ...extras.map((e) => ({ ...e, required: 0, used: e.used })),
    ],
  });
}

export async function updateTaskStatus(req, res) {
  const task = await Task.findById(req.params.id);
  
  if (
    !task ||
    req.user.role === "Worker" ||
    (req.user.role === "Engineer" && task.assignedTo.toString() !== req.user.id)
  ) {
    return res.status(403).json({ message: "Not your task" });
  } else {
    task.status = req.body.status;
    await task.save();
    res.json({ message: "Task status updated" });
  }
}

export async function updateTask(req, res) {
  const data = parse(taskUpdateSchema, req.body);
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ detail: "Task not found" });
  if (!canEditTask(req.user, task)) return res.status(403).json({ detail: "Not on this task" });
  if (data.expectedDays !== undefined) task.expectedDays = data.expectedDays;
  if (data.progress !== undefined) {
    task.progress = data.progress;
    if (data.progress > 0 && task.status === "Pending") {
      task.status = "In Progress";
      task.startedAt = task.startedAt || new Date();
    }
  }
  if (data.requiredMaterials) task.requiredMaterials = data.requiredMaterials;
  await task.save();
  res.json({ message: "Task updated" });
}

export async function addTaskMember(req, res) {
  const { userId, kind } = parse(taskMemberSchema, req.body);
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ detail: "Task not found" });
  const target = await User.findById(userId);
  if (!target) return res.status(404).json({ detail: "User not found" });

  // permission: engineers on the task may add labours; admin/storekeeper may add anyone
  const isStaff = req.user.role === "Admin" || req.user.role === "Storekeeper";
  const onTaskEngineer =
    req.user.role === "Engineer" && task.engineers.some((id) => id.toString() === req.user.id);
  if (!isStaff && !(onTaskEngineer && kind === "Worker")) {
    return res.status(403).json({ detail: "Not allowed to add members" });
  }

  // reject if the target is already on ANOTHER active task
  const busy = await Task.exists({
    _id: { $ne: task._id },
    status: { $ne: "Completed" },
    [kind === "Engineer" ? "engineers" : "workers"]: userId,
  });
  if (busy) return res.status(409).json({ detail: `${target.name} is already assigned to another active task` });

  const field = kind === "Engineer" ? "engineers" : "workers";
  if (!task[field].some((id) => id.toString() === userId)) task[field].push(userId);
  await task.save();
  res.json({ message: "Member added" });
}

export async function removeTaskMember(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ detail: "Task not found" });
  if (!canEditTask(req.user, task)) return res.status(403).json({ detail: "Not on this task" });
  task.engineers = task.engineers.filter((id) => id.toString() !== req.params.userId);
  task.workers = task.workers.filter((id) => id.toString() !== req.params.userId);
  await task.save();
  res.json({ message: "Member removed" });
}

export async function completeTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ detail: "Task not found" });
  if (!canEditTask(req.user, task)) return res.status(403).json({ detail: "Not on this task" });

  const used = await utilisedForTask(task._id);
  const shortfall = task.requiredMaterials
    .map((row) => {
      const hit = used.find((u) => u.materialId === row.materialId.toString());
      const usedQty = hit?.used || 0;
      return { name: row.materialName, required: row.quantity, used: usedQty };
    })
    .filter((row) => row.used < row.required);

  if (shortfall.length) {
    return res.status(400).json({
      detail: `Cannot complete — utilised materials below requirement`,
      shortfall,
    });
  }
  task.status = "Completed";
  task.progress = 100;
  task.completedAt = new Date();
  await task.save();
  await logActivity(req.user, "completed", "task", task.id, task.taskName);
  res.json({ message: "Task completed" });
}

export async function taskRoster(req, res) {
  // returns users of a role plus which active task (if any) they are currently busy on
  const role = req.query.role;
  if (!["Engineer", "Worker"].includes(role)) return res.status(400).json({ detail: "role query is required" });
  const users = await User.find({ role, active: { $ne: false } }).sort({ name: 1 }).lean();
  const busy = await Task.find(
    {
      status: { $ne: "Completed" },
      [role === "Engineer" ? "engineers" : "workers"]: { $in: users.map((u) => u._id) },
    },
    { taskName: 1, engineers: 1,workers: 1 }
  ).lean();
  const map = new Map();
  for (const task of busy) {
    for (const uid of task[role === "Engineer" ? "engineers" : "workers"]) {
      map.set(uid.toString(), task.taskName);
    }
  }
  res.json(
    users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      busyOnTask: map.get(u._id.toString()) || null,
    }))
  );
}

export async function listTransactions(req, res) {
  const query = req.query.transactionType 
    ? { transactionType: req.query.transactionType } 
    : {};
    
  const transactions = await Transaction.find(query)
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();
    
  res.json(transactions.map(clean));
}

export async function createTransaction(req, res) {
  const data = parse(transactionSchema, req.body);
  
  const { material, newStock } = await applyStock(
    data.materialId, 
    data.transactionType, 
    data.quantity
  );
  
  const transaction = await Transaction.create({
    ...data,
    materialName: material.name,
    processedBy: req.user.id,
    processedByName: req.user.name,
  });
  
  await logActivity(
    req.user, 
    data.transactionType.toLowerCase(), 
    "transaction", 
    transaction.id, 
    material.name
  );
  
  res.json({ message: "Transaction recorded", newStock });
}
