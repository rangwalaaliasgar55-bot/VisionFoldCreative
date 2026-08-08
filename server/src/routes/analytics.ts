import { Router } from "express";
import { readDB } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", authMiddleware, requireRole(["admin", "editor"]), (req: AuthRequest, res) => {
  const db = readDB();
  const projects = db.projects;
  const invoices = db.invoices;
  const clients = db.clients;
  const messages = db.messages;

  const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toISOString().slice(0, 7);
    const amount = invoices
      .filter((inv: any) => inv.status === "paid" && inv.paidAt?.startsWith(month))
      .reduce((s: number, inv: any) => s + (inv.amount || 0), 0);
    return { month, amount };
  }).reverse();

  const projectStatus = {
    pending: projects.filter((p: any) => p.status === "pending").length,
    "in-progress": projects.filter((p: any) => p.status === "in-progress").length,
    review: projects.filter((p: any) => p.status === "review").length,
    completed: projects.filter((p: any) => p.status === "completed").length,
  };

  const categoryBreakdown = projects.reduce((acc: any, p: any) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const recentActivity = (db.activities || []).slice(-20).reverse();

  res.json({
    overview: {
      totalRevenue,
      totalProjects: projects.length,
      totalClients: clients.length,
      unreadMessages: messages.filter((m: any) => !m.read).length,
    },
    monthlyRevenue,
    projectStatus,
    categoryBreakdown,
    recentActivity,
  });
});

router.post("/track", (req, res) => {
  const { page, event, metadata } = req.body;
  const db = readDB();
  if (!db.analytics) db.analytics = { pageViews: [], events: [] };
  db.analytics.pageViews.push({ page, timestamp: new Date().toISOString(), metadata });
  if (db.analytics.pageViews.length > 10000) db.analytics.pageViews = db.analytics.pageViews.slice(-5000);
  db.analytics.events.push({ event, timestamp: new Date().toISOString(), metadata });
  res.json({ ok: true });
});

export default router;
