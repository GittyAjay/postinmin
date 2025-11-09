import fs from "fs";
import cors from "cors";
import express from "express";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { setupSwagger } from "./config/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import businessRoutes from "./routes/businessRoutes";
import templateRoutes from "./routes/templateRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import renderRoutes from "./routes/renderRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import aiRoutes from "./routes/aiRoutes";
import searchRoutes from "./routes/searchRoutes";
import postRoutes from "./routes/postRoutes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

const router = express.Router();
setupSwagger(router);
router.use("/auth", authRoutes);
router.use("/business", businessRoutes);
router.use("/template", templateRoutes);
router.use("/calendar", calendarRoutes);
router.use("/render", renderRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);
router.use("/search", searchRoutes);
router.use("/posts", postRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", environment: env.NODE_ENV });
});

app.use("/api", router);

app.get("*", (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  const indexPath = path.join(publicDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return next();
  }
  res.sendFile(indexPath);
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: `Route ${req.path} not found` });
});

app.use(errorHandler);

export default app;

