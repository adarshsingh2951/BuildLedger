import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { dashboard, yoloStatus } from "../controllers/dashboardController.js";

const router = Router();
router.get("/dashboard", requireAuth, dashboard);
router.get("/yolo/status", requireAuth, yoloStatus);

export default router;
