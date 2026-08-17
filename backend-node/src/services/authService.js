import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
export const createToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: "8h" });
export const publicUser = (user) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt });