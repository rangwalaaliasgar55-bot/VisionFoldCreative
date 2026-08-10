import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB, addToCollection, updateInCollection, deleteFromCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const db = readDB();
  res.json(db.outreach);
});

router.post("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const lead = {
    id: uuidv4(),
    ...req.body,
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addToCollection("outreach", lead);
  res.status(201).json(lead);
});

router.post("/import", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const { leads } = req.body;
  const imported = (leads || []).map((l: any) => ({
    id: uuidv4(),
    ...l,
    status: "imported",
    source: "import",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const db = readDB();
  db.outreach.push(...imported);
  writeDB(db);
  res.json({ imported: imported.length });
});

router.patch("/:id", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const updated = updateInCollection("outreach", req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Lead not found" });
  res.json(updated);
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const ok = deleteFromCollection("outreach", req.params.id);
  if (!ok) return res.status(404).json({ error: "Lead not found" });
  res.json({ message: "Deleted" });
});

export default router;
