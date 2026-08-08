import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/db.json");

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
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readDB(): DBSchema {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    return JSON.parse(JSON.stringify(defaultDB));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

export function writeDB(db: DBSchema) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getCollection<T extends keyof DBSchema>(name: T): DBSchema[T] {
  return readDB()[name];
}

export function setCollection<T extends keyof DBSchema>(name: T, data: DBSchema[T]) {
  const db = readDB();
  db[name] = data;
  writeDB(db);
}

export function addToCollection<T extends keyof DBSchema>(name: T, item: any) {
  const db = readDB();
  (db[name] as any[]).push(item);
  writeDB(db);
  return item;
}

export function updateInCollection<T extends keyof DBSchema>(name: T, id: string, updates: any, idField = "id") {
  const db = readDB();
  const col = db[name] as any[];
  const idx = col.findIndex((x) => x[idField] === id);
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(db);
  return col[idx];
}

export function deleteFromCollection<T extends keyof DBSchema>(name: T, id: string, idField = "id") {
  const db = readDB();
  const col = db[name] as any[];
  const idx = col.findIndex((x) => x[idField] === id);
  if (idx === -1) return false;
  col.splice(idx, 1);
  writeDB(db);
  return true;
}
