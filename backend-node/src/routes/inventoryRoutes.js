import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as c from "../controllers/inventoryController.js";

const router = Router();
const auth = requireAuth;
const staff = [requireAuth, requireRole("Admin", "Storekeeper")];
const guard = [requireAuth, requireRole("Admin")];

// Materials
router.get("/materials", auth, c.listMaterials);
router.post("/materials", staff, c.createMaterial);
router.patch("/materials/:id", staff, c.updateMaterial);
router.delete("/materials/:id", staff, c.deleteMaterial);

// Tasks
router.get("/tasks", auth, c.listTasks);
router.post("/tasks", staff, c.createTask);
router.patch("/tasks/:id/status",staff, c.updateTaskStatus);
router.get("/tasks/roster", auth, c.taskRoster);
router.get("/tasks/:id", auth, c.getTaskDetail);
router.patch("/tasks/:id", auth, c.updateTask);
router.post("/tasks/:id/members", auth, c.addTaskMember);
router.delete("/tasks/:id/members/:userId", auth, c.removeTaskMember);
router.post("/tasks/:id/complete", auth, c.completeTask);

// Transactions
router.get("/transactions", auth, c.listTransactions);
router.post("/transactions", staff, c.createTransaction);



export default router;
