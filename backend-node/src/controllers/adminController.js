import User from "../models/User.js";
import Activity from "../models/Activity.js";
import SiteSettings from "../models/SiteSettings.js";
import { parse, registerSchema, roleSchema, settingsSchema } from "../schemas/common.js";
import { hashPassword, publicUser } from "../services/authService.js";
import { logActivity } from "../services/activityService.js";

const cleanDoc = (doc) => {
  if (!doc) return doc;
  const value = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = value;
  return { id: _id?.toString(), ...rest };
};

export async function listUsers(req, res) {
  const users = await User.find().sort({ name: 1 });
  res.json(users.map(publicUser));
}

export async function createUser(req, res) {
  const data = parse(
    registerSchema.extend({ role: roleSchema.shape.role.default("Engineer") }),
    req.body
  );
  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    password: await hashPassword(data.password),
  });
  await logActivity(req.user, "added", "user", user.id, user.role);
  res.status(201).json(publicUser(user));
}

export async function updateRole(req, res) {
  const { role } = parse(roleSchema, req.body);
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ detail: "User not found" });
  target.role = role;
  await target.save();
  await logActivity(req.user, "changed role", "user", req.params.id, role);
  res.json({ message: "Role updated" });
}

export async function toggleActive(req, res) {
  const target = await User.findById(req.params.id);
  if (!target || target.id === req.user.id) {
    return res.status(400).json({ detail: "Cannot change this account" });
  }
  target.active = !target.active;
  await target.save();
  res.json({ active: target.active });
}

export async function activity(req, res) {
  const entries = await Activity.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json(entries.map(cleanDoc));
}
export async function getSettings(req, res) {
    const settings = await SiteSettings.findOne().lean();

    res.json(
        settings || { siteName: "North Block", siteCode: "SITE 04", projectNote: "" }
    );
}


export async function saveSettings(req, res) {
  const data = parse(settingsSchema, req.body);

  const settings = await SiteSettings.findOneAndUpdate({}, data, {
    upsert: true,
    new: true,
    runValidators: true,
  });
  res.json(cleanDoc(settings.toObject()));
}
