import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, updateInCollection, deleteFromCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const db = readDB();
  res.json(db.clients);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  const client = db.clients.find((c: any) => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  if (req.user.role === "client" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(client);
});

router.post("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const client = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addToCollection("clients", client);
  res.status(201).json(client);
});

router.patch("/:id", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const updated = updateInCollection("clients", req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Client not found" });
  res.json(updated);
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const ok = deleteFromCollection("clients", req.params.id);
  if (!ok) return res.status(404).json({ error: "Client not found" });
  res.json({ message: "Deleted" });
});

export default router;
