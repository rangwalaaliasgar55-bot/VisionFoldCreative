import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, updateInCollection } from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  const notifs = db.notifications.filter((n: any) => n.userId === req.user.id);
  res.json(notifs);
});

router.post("/", authMiddleware, (req: AuthRequest, res) => {
  const notif = {
    id: uuidv4(),
    userId: req.body.userId,
    ...req.body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  addToCollection("notifications", notif);
  res.status(201).json(notif);
});

router.patch("/:id/read", authMiddleware, (req: AuthRequest, res) => {
  const updated = updateInCollection("notifications", req.params.id, { read: true });
  if (!updated) return res.status(404).json({ error: "Notification not found" });
  res.json(updated);
});

export default router;
