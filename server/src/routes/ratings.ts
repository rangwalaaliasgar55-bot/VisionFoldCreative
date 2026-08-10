import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, addToCollection } from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.ratings);
});

router.get("/public", (req, res) => {
  const db = readDB();
  res.json(db.ratings.filter((r: any) => r.approved));
});

router.post("/", authMiddleware, (req: AuthRequest, res) => {
  const rating = {
    id: uuidv4(),
    clientId: req.user.id,
    clientName: req.user.name,
    ...req.body,
    approved: false,
    createdAt: new Date().toISOString(),
  };
  addToCollection("ratings", rating);
  res.status(201).json(rating);
});

export default router;
