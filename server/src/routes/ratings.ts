import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection } from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.ratings || []);
});

router.post("/", authMiddleware, (req: AuthRequest, res) => {
  const rating = {
    id: uuidv4(),
    userId: req.user.id,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  addToCollection("ratings", rating);
  res.status(201).json(rating);
});

export default router;
