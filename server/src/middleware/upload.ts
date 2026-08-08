import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const typeDir = path.join(uploadDir, file.fieldname || "misc");
    if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/", "image/", "audio/", "application/pdf", "text/", "application/zip"];
    if (allowed.some((t) => file.mimetype.startsWith(t) || file.mimetype === t)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});
