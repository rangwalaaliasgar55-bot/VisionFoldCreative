import { Router } from "express";
import { readDB, writeDB } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

router.get("/public", (req, res) => {
  const db = readDB();
  const { aiEnabled, aiModel, aiDailyBudget, aiUsage, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

router.patch("/", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

export default router;
