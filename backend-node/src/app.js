import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import yoloRoutes from "./routes/yoloRoutes.js";

import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/", (req, res) => {
  res.json({
    message: "BuildLedger Node API online",
    stack: "MERN",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/yolo", yoloRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;