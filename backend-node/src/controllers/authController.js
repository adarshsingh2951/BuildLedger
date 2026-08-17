import User from "../models/User.js";
import { parse, registerSchema, loginSchema,passwordChangeSchema } from "../schemas/common.js";
import { hashPassword, comparePassword, createToken, publicUser } from "../services/authService.js";
import { logActivity } from "../services/activityService.js";
import { env } from "../config/env.js";

const session = (res, user) => {
  const token = createToken(user);
  
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
  });
  
  return token;
};

export async function register(req, res) {
  const data = parse(registerSchema, req.body);
  
  if (await User.exists({ email: data.email.toLowerCase() })) {
    return res.status(409).json({ detail: "Email already registered" });
  }
  
  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    password: await hashPassword(data.password),
  });
  
  const token = session(res, user);
  
  await logActivity(user, "registered", "user", user.id);
  
  res.json({ ...publicUser(user), token });
}

export async function login(req, res) {
  const data = parse(loginSchema, req.body);
  
  const user = await User.findOne({ email: data.email.toLowerCase() }).select("+password");
  
  if (!user || !(await comparePassword(data.password, user.password))) {
    return res.status(401).json({ detail: "Invalid email or password" });
  }
  
  const token = session(res, user);
  
  res.json({ ...publicUser(user), token });
}

export function logout(req, res) {
  res.clearCookie("access_token");
  res.json({ message: "Signed out" });
}

export function me(req, res) {
  res.json(publicUser(req.user));
}

export async function claimFirstAdmin(req, res) {
  if (await User.exists({ role: "Admin" })) {
    return res.status(409).json({ detail: "An admin already exists" });
  }
  
  req.user.role = "Admin";
  await req.user.save();
  
  res.json({ message: "You are now the first admin" });
}

//
export async function changePassword(req, res) {
  const data = parse(passwordChangeSchema, req.body);
  const user = await User.findById(req.user.id).select("+password");
  if (!user || !(await comparePassword(data.currentPassword, user.password))) {
    return res.status(400).json({ detail: "Current password is incorrect" });
  }
  user.password = await hashPassword(data.newPassword);
  await user.save();
  res.json({ message: "Password updated" });
}