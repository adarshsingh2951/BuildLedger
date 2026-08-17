import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listUsers, createUser, updateRole, toggleActive, activity,getSettings,saveSettings } from "../controllers/adminController.js";

const router = Router();
const guard = [requireAuth, requireRole("Admin")];

router.get("/users", guard, listUsers);
router.post("/users", guard, createUser);
router.patch("/users/:id/role", guard, updateRole);
router.patch("/users/:id/active", guard, toggleActive);
router.get("/activity", guard, activity);
router.get("/settings", requireAuth, getSettings);
router.put("/settings", guard, saveSettings);

export default router;
