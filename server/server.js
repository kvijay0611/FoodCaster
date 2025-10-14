import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs"; // bcryptjs -> no native compilation
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const DB_FILE = path.join(process.cwd(), "db.json");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure db.json exists and is valid JSON (safe init)
function ensureDbFile() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
      console.log("Created db.json with defaults");
    } else {
      const content = fs.readFileSync(DB_FILE, "utf8").trim();
      if (!content) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
        console.log("Initialized empty db.json with defaults");
      } else {
        try {
          JSON.parse(content);
        } catch (err) {
          fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
          console.log("Rewrote corrupted db.json with defaults");
        }
      }
    }
  } catch (err) {
    console.error("Failed to ensure db.json exists:", err);
    process.exit(1);
  }
}
ensureDbFile();

const adapter = new JSONFile(DB_FILE);
// Low constructor signature differs between versions; try both ways
let db;
try {
  db = new Low(adapter, { users: [], favorites: [], ratings: [] });
} catch (err) {
  db = new Low(adapter);
}

async function initDB() {
  await db.read();
  db.data ||= { users: [], favorites: [], ratings: [] };
  await db.write();
}
await initDB();

// nodemailer transporter (optional) - configure via env
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // verify transporter (best-effort)
  transporter.verify().then(() => {
    console.log("SMTP transporter configured");
  }).catch((err) => {
    console.warn("SMTP transporter verify failed (mail will fallback to console):", err.message || err);
    transporter = null;
  });
} else {
  console.log("SMTP not configured - contact endpoint will log messages instead of sending email.");
}

// helper: sign JWT
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// auth middleware
function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ ok: false, message: "Missing Authorization header" });
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ ok: false, message: "Invalid Authorization header" });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}

/* ------------------ Endpoints ------------------ */

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email & password required" });
    const normalized = String(email).toLowerCase();
    await db.read();
    db.data ||= { users: [], favorites: [], ratings: [] };
    const existing = db.data.users.find(u => u.email === normalized);
    if (existing) return res.status(409).json({ ok: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const id = nanoid();
    db.data.users.push({ id, email: normalized, password: hashed });
    await db.write();

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
    await db.read();
    const user = db.data.users.find(u => u.email === normalized);
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

// Me
app.get("/api/me", authMiddleware, (req, res) => {
  return res.json({ ok: true, email: req.user.email, id: req.user.id });
});

/* Favorites */
// Get favorites for current user (returns recipe ids)
app.get("/api/favorites", authMiddleware, async (req, res) => {
  try {
    await db.read();
    db.data ||= { users: [], favorites: [], ratings: [] };
    const favs = db.data.favorites.filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
    return res.json({ ok: true, favorites: favs });
  } catch (err) {
    console.error("Get favorites error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Toggle favorite
app.post("/api/favorites/toggle", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body || {};
    if (!recipeId) return res.status(400).json({ ok: false, message: "recipeId required" });

    await db.read();
    db.data ||= { users: [], favorites: [], ratings: [] };
    const idx = db.data.favorites.findIndex(f => f.user_id === req.user.id && f.recipe_id === recipeId);
    if (idx >= 0) {
      db.data.favorites.splice(idx, 1);
    } else {
      db.data.favorites.push({ id: nanoid(), user_id: req.user.id, recipe_id: recipeId });
    }
    await db.write();
    const favs = db.data.favorites.filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
    return res.json({ ok: true, favorites: favs });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* Ratings */
// Post rating (add/update/undo). Requires auth.
app.post("/api/rate", authMiddleware, async (req, res) => {
  try {
    const { recipeId, rating } = req.body || {};
    if (!recipeId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: "Invalid rating" });
    }

    await db.read();
    db.data ||= { users: [], favorites: [], ratings: [] };

    db.data.ratings = db.data.ratings || [];
    const existingIndex = db.data.ratings.findIndex(r => r.user_id === req.user.id && r.recipe_id === recipeId);

    if (existingIndex >= 0) {
      const existing = db.data.ratings[existingIndex];
      // If same rating clicked -> remove (undo)
      if (existing.value === rating) {
        db.data.ratings.splice(existingIndex, 1);
      } else {
        existing.value = rating;
      }
    } else {
      db.data.ratings.push({ id: nanoid(), user_id: req.user.id, recipe_id: recipeId, value: rating });
    }

    await db.write();

    const recipeRatings = db.data.ratings.filter(r => r.recipe_id === recipeId);
    const avg = recipeRatings.length > 0 ? recipeRatings.reduce((a, b) => a + b.value, 0) / recipeRatings.length : 0;
    return res.json({ ok: true, average: Number(avg.toFixed(2)), total: recipeRatings.length });
  } catch (err) {
    console.error("Rate error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Get rating info for recipe
app.get("/api/rate/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;
    await db.read();
    db.data ||= { users: [], favorites: [], ratings: [] };
    const recipeRatings = db.data.ratings.filter(r => r.recipe_id === recipeId);
    const avg = recipeRatings.length > 0 ? recipeRatings.reduce((a, b) => a + b.value, 0) / recipeRatings.length : 0;
    return res.json({ ok: true, average: Number(avg.toFixed(2)), total: recipeRatings.length });
  } catch (err) {
    console.error("Get recipe ratings error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* Contact endpoint - sends email using SMTP if configured, otherwise logs */
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ ok: false, message: "name, email, message required" });

    const toEmail = process.env.CONTACT_TO || process.env.SMTP_USER || null;

    const subject = `Contact form: ${name}`;
    const html = `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Message:</strong></p>
      <div>${String(message).replace(/\n/g, "<br/>")}</div>
    `;

    if (transporter && toEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html,
        replyTo: email,
      });
      return res.json({ ok: true, message: "Message sent" });
    } else {
      // fallback: write to /tmp/contact-logs or console (helpful for debug / render)
      try {
        const logLine = `${new Date().toISOString()} | ${name} <${email}> | ${message}\n\n`;
        const logFile = path.join(process.cwd(), "contact.log");
        fs.appendFileSync(logFile, logLine, "utf8");
      } catch (err) {
        // ignore
      }
      console.log("Contact message (logged):", { name, email, message });
      return res.json({ ok: true, message: "Message logged (SMTP not configured)" });
    }
  } catch (err) {
    console.error("Contact error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* Start server */
app.listen(PORT, () => {
  console.log(`JSON-file server listening on http://localhost:${PORT}`);
});
