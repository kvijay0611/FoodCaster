// server/server.js (simple JSON-file DB, no lowdb)
// Minimal Express server with JSON file persistence (safe on Windows)
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const DB_FILE = path.join(process.cwd(), "db.json");

const app = express();
app.use(cors());
app.use(express.json());

// --- Simple JSON DB helpers ---
function ensureDbFile() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [] }, null, 2), "utf8");
      console.log("Created db.json with defaults");
    } else {
      const content = fs.readFileSync(DB_FILE, "utf8").trim();
      if (!content) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [] }, null, 2), "utf8");
        console.log("Initialized empty db.json with defaults");
      } else {
        try {
          JSON.parse(content);
        } catch (err) {
          fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [] }, null, 2), "utf8");
          console.log("Rewrote corrupted db.json with defaults");
        }
      }
    }
  } catch (err) {
    console.error("Error ensuring db file:", err);
    process.exit(1);
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw || '{"users":[],"favorites":[]}');
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Keep an in-memory copy to reduce fs ops (reads/writes still safe for small dev server)
let DB = readDb();

// helper to persist in-memory DB to disk
function persist() {
  writeDb(DB);
}

// -------------------- auth helpers --------------------
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization header" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ message: "Invalid Authorization header" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// -------------------- endpoints --------------------

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email & password required" });

    const normalized = String(email).toLowerCase();
    const existing = DB.users.find(u => u.email === normalized);
    if (existing) return res.status(409).json({ ok: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const id = nanoid();
    DB.users.push({ id, email: normalized, password: hashed });
    persist();

    const token = signToken({ id, email: normalized });
    return res.json({ ok: true, token, email: normalized });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email & password required" });

    const normalized = String(email).toLowerCase();
    const user = DB.users.find(u => u.email === normalized);
    if (!user) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email });
    return res.json({ ok: true, token, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Whoami
app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ ok: true, email: req.user.email });
});

// Get favorites for current user
app.get("/api/favorites", authMiddleware, (req, res) => {
  try {
    const favs = DB.favorites.filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
    return res.json({ ok: true, favorites: favs });
  } catch (err) {
    console.error("Get favorites error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Toggle favorite (add/remove)
app.post("/api/favorites/toggle", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body || {};
    if (!recipeId) return res.status(400).json({ ok: false, message: "recipeId required" });

    const idx = DB.favorites.findIndex(f => f.user_id === req.user.id && f.recipe_id === recipeId);
    if (idx >= 0) {
      DB.favorites.splice(idx, 1);
    } else {
      DB.favorites.push({ id: nanoid(), user_id: req.user.id, recipe_id: recipeId });
    }

    persist();
    const favs = DB.favorites.filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
    return res.json({ ok: true, favorites: favs });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Start
app.listen(PORT, () => {
  console.log(`JSON-file server listening on http://localhost:${PORT}`);
});
