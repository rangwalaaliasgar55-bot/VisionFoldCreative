import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel
  ? path.join("/tmp", "visionfold-data")
  : path.join(__dirname, "../../data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export interface DBSchema {
  users: any[];
  projects: any[];
  clients: any[];
  invoices: any[];
  media: any[];
  messages: any[];
  ratings: any[];
  outreach: any[];
  notifications: any[];
  settings: any;
  analytics: any;
  activities: any[];
}

const defaultDB: DBSchema = {
  users: [],
  projects: [],
  clients: [],
  invoices: [],
  media: [],
  messages: [],
  ratings: [],
  outreach: [],
  notifications: [],
  settings: {
    siteName: "VisionFold Creative",
    maintenanceMode: false,
    maintenanceMessage: "",
    maintenanceCountdown: null,
    aiEnabled: true,
    aiModel: "gemini-2.0-flash",
    aiDailyBudget: 250000,
    aiUsage: { today: 0, total: 0 },
    branding: { logo: "", favicon: "", primaryColor: "#6366f1" },
    social: { instagram: "", twitter: "", youtube: "", linkedin: "" },
    contact: { email: "hello@visionfold.studio", phone: "", address: "" },
  },
  analytics: {
    pageViews: [],
    events: [],
    visitors: [],
  },
  activities: [],
};

function ensureDir() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn("[DB] Could not create DATA_DIR (read-only FS?):", err);
  }
}

export function readDB(): DBSchema {
  ensureDir();
  try {
    if (!fs.existsSync(DB_PATH)) {
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      } catch {
        /* non-fatal on Vercel */
      }
      return JSON.parse(JSON.stringify(defaultDB));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (err) {
    console.warn("[DB] read failed; using defaults:", err);
    return JSON.parse(JSON.stringify(defaultDB));
  }
}

export function writeDB(db: DBSchema) {
  try {
    ensureDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("[DB] Failed to persist (non-fatal):", err);
  }
}

export function getCollection<T extends keyof DBSchema>(name: T): DBSchema[T] {
  return readDB()[name];
}

export function setCollection<T extends keyof DBSchema>(name: T, data: DBSchema[T]) {
  const db = readDB();
  db[name] = data;
  writeDB(db);
}
