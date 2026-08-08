import { Router } from "express";
import { readDB, updateInCollection } from "../db.js";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

router.get("/status", (req, res) => {
  const db = readDB();
  res.json({
    configured: !!GEMINI_API_KEY,
    provider: GEMINI_API_KEY ? "gemini" : "none",
    model: GEMINI_MODEL,
    phase: "D",
    usage: db.settings.aiUsage,
  });
});

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  const { message } = req.body;
  const db = readDB();

  if (!GEMINI_API_KEY) {
    const responses: Record<string, string> = {
      hello: "Hello! I'm VisionFold AI. How can I help with your video project today?",
      pricing: "Our pricing depends on project scope. Commercials start at $5,000. Contact us for a custom quote!",
      timeline: "Most projects take 2-6 weeks depending on complexity. Rush delivery is available.",
      services: "We offer commercial editing, VFX, color grading, audio post-production, subtitling, and documentary editing.",
    };
    const lower = (message || "").toLowerCase();
    const match = Object.keys(responses).find((k) => lower.includes(k));
    return res.json({
      reply: match ? responses[match] : "I'd be happy to help with that! Please contact our team for detailed assistance.",
      source: "rules",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request.";
    const tokens = reply.length + (message || "").length;
    db.settings.aiUsage.today += tokens;
    db.settings.aiUsage.total += tokens;
    res.json({ reply, source: "gemini", model: GEMINI_MODEL });
  } catch (err) {
    res.status(500).json({ error: "AI service error", source: "error" });
  }
});

router.post("/insights", authMiddleware, requireRole(["admin"]), async (req: AuthRequest, res) => {
  const db = readDB();
  const projects = db.projects;
  const invoices = db.invoices;
  const clients = db.clients;
  const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const pendingRevenue = invoices.filter((i: any) => i.status === "sent").reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const activeProjects = projects.filter((p: any) => p.status === "in-progress").length;
  const completedProjects = projects.filter((p: any) => p.status === "completed").length;
  const insight = `Studio Overview: ${activeProjects} active projects, ${completedProjects} completed. Total revenue: $${totalRevenue.toLocaleString()}. Pending: $${pendingRevenue.toLocaleString()}. Client base: ${clients.length}.`;
  res.json({ insight, metrics: { totalRevenue, pendingRevenue, activeProjects, completedProjects, clientCount: clients.length } });
});

export default router;
