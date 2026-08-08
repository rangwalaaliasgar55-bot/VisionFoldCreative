import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB, addToCollection, updateInCollection } from "../db.js";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

function seedAdmin() {
  const db = readDB();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@visionfold.studio";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  if (!db.users.find((u: any) => u.role === "admin")) {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.users.push({
      id: uuidv4(),
      email: adminEmail,
      password: hash,
      name: "Admin",
      role: "admin",
      avatar: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    writeDB(db);
    console.log(`Admin seeded: ${adminEmail}`);
  }
}
seedAdmin();

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  const db = readDB();
  if (db.users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(),
    email,
    password: hash,
    name,
    role: "client",
    avatar: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addToCollection("users", user);
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email, name, role: user.role, avatar: user.avatar } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email, name: user.name, role: user.role, avatar: user.avatar } });
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  const { password, ...user } = req.user;
  res.json(user);
});

router.patch("/me", authMiddleware, (req: AuthRequest, res) => {
  const updates = { ...req.body };
  delete updates.password;
  delete updates.role;
  const user = updateInCollection("users", req.user.id, updates);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...safe } = user;
  res.json(safe);
});

router.post("/change-password", authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(currentPassword, req.user.password)) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  updateInCollection("users", req.user.id, { password: hash });
  res.json({ message: "Password updated" });
});

export default router;
