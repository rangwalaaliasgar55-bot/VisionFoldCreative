import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, updateInCollection, deleteFromCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  let projects = db.projects;
  if (req.user.role === "client") {
    projects = projects.filter((p: any) => p.clientId === req.user.id);
  }
  res.json(projects);
});

router.get("/public", (req, res) => {
  const db = readDB();
  const publicProjects = db.projects.filter((p: any) => p.isPublic).map((p: any) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    thumbnail: p.thumbnail,
    client: p.clientName,
  }));
  res.json(publicProjects);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  const project = db.projects.find((p: any) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (req.user.role === "client" && project.clientId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(project);
});

router.post("/", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const project = {
    id: uuidv4(),
    ...req.body,
    status: req.body.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addToCollection("projects", project);
  res.status(201).json(project);
});

router.patch("/:id", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  const project = db.projects.find((p: any) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (req.user.role === "client" && project.clientId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const updated = updateInCollection("projects", req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
  res.json(updated);
});

router.delete("/:id", authMiddleware, requireRole(["admin"]), (req: AuthRequest, res) => {
  const ok = deleteFromCollection("projects", req.params.id);
  if (!ok) return res.status(404).json({ error: "Project not found" });
  res.json({ message: "Deleted" });
});

export default router;
