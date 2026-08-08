import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection, deleteFromCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res) => {
  const db = readDB();
  res.json(db.media);
});

router.post("/upload", authMiddleware, upload.single("file"), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const media = {
    id: uuidv4(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.fieldname}/${req.file.filename}`,
    uploadedBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  addToCollection("media", media);
  res.json(media);
});

router.delete("/:id", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const ok = deleteFromCollection("media", req.params.id);
  if (!ok) return res.status(404).json({ error: "Media not found" });
  res.json({ message: "Deleted" });
});

export default router;
