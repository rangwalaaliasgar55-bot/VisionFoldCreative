import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, updateInCollection, deleteFromCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  if (req.user.role === "client") {
    return res.json(db.invoices.filter((i: any) => i.clientId === req.user.id));
  }
  res.json(db.invoices);
});

router.post("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const invoice = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || "pending",
    createdAt: new Date().toISOString(),
  };
  addToCollection("invoices", invoice);
  res.status(201).json(invoice);
});

router.patch("/:id", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const updated = updateInCollection("invoices", req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Invoice not found" });
  res.json(updated);
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const ok = deleteFromCollection("invoices", req.params.id);
  if (!ok) return res.status(404).json({ error: "Invoice not found" });
  res.json({ message: "Deleted" });
});

export default router;
