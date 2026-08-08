import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, updateInCollection } from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  if (req.user.role === "client") {
    return res.json(db.messages.filter((m: any) => m.clientId === req.user.id || m.senderId === req.user.id));
  }
  res.json(db.messages);
});

router.get("/conversations", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  const conversations = new Map();
  db.messages.forEach((m: any) => {
    const key = m.projectId || m.clientId || "general";
    if (!conversations.has(key)) {
      conversations.set(key, { id: key, messages: [], lastMessage: null });
    }
    conversations.get(key).messages.push(m);
    if (!conversations.get(key).lastMessage || new Date(m.createdAt) > new Date(conversations.get(key).lastMessage.createdAt)) {
      conversations.get(key).lastMessage = m;
    }
  });
  res.json(Array.from(conversations.values()));
});

router.post("/", authMiddleware, (req: AuthRequest, res) => {
  const msg = {
    id: uuidv4(),
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    ...req.body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  addToCollection("messages", msg);
  res.status(201).json(msg);
});

router.patch("/:id/read", authMiddleware, (req: AuthRequest, res) => {
  const updated = updateInCollection("messages", req.params.id, { read: true });
  if (!updated) return res.status(404).json({ error: "Message not found" });
  res.json(updated);
});

export default router;
