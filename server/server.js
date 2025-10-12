// server/server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs"; // bcryptjs avoids native build issues on deploy
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// -------------------- lowdb safe initialization --------------------
const dbFile = path.join(process.cwd(), "db.json");

// ensure db.json exists and contains valid JSON with defaults
try {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
    console.log("Created db.json with defaults");
  } else {
    const content = fs.readFileSync(dbFile, "utf8").trim();
    if (!content) {
      fs.writeFileSync(dbFile, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
      console.log("Initialized empty db.json with defaults");
    } else {
      try {
        JSON.parse(content);
      } catch (err) {
        fs.writeFileSync(dbFile, JSON.stringify({ users: [], favorites: [], ratings: [] }, null, 2), "utf8");
        console.log("Rewrote corrupted db.json with defaults");
      }
    }
  }
} catch (err) {
  console.error("Failed to ensure db.json exists:", err);
  process.exit(1);
}

const adapter = new JSONFile(dbFile);

// Construct Low with defaults if lowdb version supports it; otherwise set after read
let db;
try {
  db = new Low(adapter, { users: [], favorites: [], ratings: [] });
} catch (err) {
  db = new Low(adapter);
}

await db.read();
db.data ||= { users: [], favorites: [], ratings: [] };

// helper to persist DB
async function saveDB() {
  try {
    await db.write();
  } catch (err) {
    console.error("Failed to write DB:", err);
  }
}

// -------------------- helpers --------------------
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ ok: false, message: "Missing Authorization header" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ ok: false, message: "Invalid Authorization header" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}

function computeRecipeStats(recipeId) {
  const all = (db.data.ratings || []).filter(r => r.recipe_id === recipeId);
  if (!all.length) return { avg: 0, count: 0 };
  const avg = all.reduce((s, r) => s + r.value, 0) / all.length;
  return { avg: Number(avg.toFixed(2)), count: all.length };
}

// -------------------- endpoints --------------------

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: "Email & password required" });

    const normalized = String(email).toLowerCase();
    const existing = (db.data.users || []).find(u => u.email === normalized);
    if (existing) return res.status(409).json({ ok: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const id = nanoid();
    db.data.users.push({ id, email: normalized, password: hashed });
    await saveDB();

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
    const user = (db.data.users || []).find(u => u.email === normalized);
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
  return res.json({ ok: true, email: req.user.email });
});

// Get favorites
app.get("/api/favorites", authMiddleware, (req, res) => {
  try {
    const favs = (db.data.favorites || []).filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
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

    const idx = (db.data.favorites || []).findIndex(f => f.user_id === req.user.id && f.recipe_id === recipeId);
    if (idx >= 0) {
      db.data.favorites.splice(idx, 1);
    } else {
      db.data.favorites.push({ id: nanoid(), user_id: req.user.id, recipe_id: recipeId });
    }
    await saveDB();

    const favs = (db.data.favorites || []).filter(f => f.user_id === req.user.id).map(f => f.recipe_id);
    return res.json({ ok: true, favorites: favs });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Submit or update a rating
app.post("/api/rate", authMiddleware, async (req, res) => {
  try {
    const { recipeId, rating } = req.body || {};
    if (!recipeId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: "recipeId and rating (1-5) are required" });
    }

    db.data.ratings ||= [];
    const existing = db.data.ratings.find(r => r.user_id === req.user.id && r.recipe_id === recipeId);
    if (existing) {
      existing.value = rating;
      existing.updated_at = new Date().toISOString();
    } else {
      db.data.ratings.push({ id: nanoid(), user_id: req.user.id, recipe_id: recipeId, value: rating, created_at: new Date().toISOString() });
    }
    await saveDB();

    const stats = computeRecipeStats(recipeId);
    return res.json({ ok: true, stats });
  } catch (err) {
    console.error("Rate error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Get recipe rating stats
app.get("/api/ratings/recipe/:id", (req, res) => {
  try {
    const recipeId = req.params.id;
    if (!recipeId) return res.status(400).json({ ok: false });
    const stats = computeRecipeStats(recipeId);
    return res.json({ ok: true, stats });
  } catch (err) {
    console.error("Ratings fetch error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Suggestions endpoint (simple, in-memory algorithm)
app.get("/api/suggestions", async (req, res) => {
  try {
    // Ensure latest DB
    await db.read();

    // load frontend recipes file if present
    let allRecipes = [];
    try {
      const recipesPath = path.join(process.cwd(), "data", "recipes.json");
      if (fs.existsSync(recipesPath)) {
        allRecipes = JSON.parse(fs.readFileSync(recipesPath, "utf8"));
      } else {
        allRecipes = [];
      }
    } catch (err) {
      console.warn("Could not load recipes.json for suggestions", err);
      allRecipes = [];
    }

    // fallback: if no recipes on disk, try to read from package-relative path (if used)
    if (!allRecipes.length) {
      try {
        const pkgRecipes = (await import(path.join(process.cwd(), "src", "data", "recipes.json"), { assert: { type: "json" } })).default;
        allRecipes = pkgRecipes || [];
      } catch {
        // ignore
      }
    }

    // build recipeStats map
    const recipeStats = {};
    for (const r of allRecipes) {
      const rid = r.id ?? r.title ?? r.name;
      recipeStats[rid] = computeRecipeStats(rid);
    }

    // top-rated fallback
    const topRated = allRecipes
      .map(r => ({ recipe: r, stats: recipeStats[r.id ?? r.title ?? r.name] || { avg: 0, count: 0 } }))
      .sort((a, b) => (b.stats.avg || 0) - (a.stats.avg || 0))
      .slice(0, 12)
      .map(x => x.recipe);

    // if there is no Authorization header, return topRated fallback
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ ok: true, suggestions: topRated });

    // try to verify token (if invalid, return topRated)
    let user;
    try {
      const token = authHeader.split(" ")[1];
      user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.json({ ok: true, suggestions: topRated });
    }

    // gather user's highly rated recipes (>=4)
    const userRatings = (db.data.ratings || []).filter(r => r.user_id === user.id && r.value >= 4);
    if (!userRatings.length) return res.json({ ok: true, suggestions: topRated });

    // collect ingredient and diet signals
    const ingredientCounts = {};
    const dietCounts = {};
    for (const ur of userRatings) {
      const recipe = allRecipes.find(rr => (rr.id ?? rr.title ?? rr.name) === ur.recipe_id);
      if (!recipe) continue;
      const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : String(recipe.ingredients || "").split(",").map(s => s.trim());
      for (let ing of ings) {
        ing = String(ing).toLowerCase();
        if (!ing) continue;
        ingredientCounts[ing] = (ingredientCounts[ing] || 0) + 1;
      }
      const diet = recipe.diet;
      if (diet) {
        const tags = Array.isArray(diet) ? diet : [diet];
        for (let t of tags) {
          t = String(t).toLowerCase();
          dietCounts[t] = (dietCounts[t] || 0) + 1;
        }
      }
    }

    // score other recipes by ingredient overlap + diet match + avg rating
    const scored = allRecipes
      .map(r => {
        const rid = r.id ?? r.title ?? r.name;
        let score = 0;
        const ings = Array.isArray(r.ingredients) ? r.ingredients : String(r.ingredients || "").split(",").map(s => s.trim());
        for (let ing of ings) {
          ing = String(ing).toLowerCase();
          if (ingredientCounts[ing]) score += ingredientCounts[ing] * 2;
        }
        const diet = r.diet;
        const tags = diet ? (Array.isArray(diet) ? diet : [diet]) : [];
        for (let t of tags) {
          t = String(t).toLowerCase();
          if (dietCounts[t]) score += dietCounts[t] * 1.5;
        }
        const avg = recipeStats[rid]?.avg || 0;
        score += avg * 0.2; // small rating boost
        return { recipe: r, score, avg };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(x => x.recipe);

    const suggestions = scored.length ? scored : topRated;
    return res.json({ ok: true, suggestions });
  } catch (err) {
    console.error("Suggestions error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Optional: serve recipes from server (useful if frontend wants to fetch from backend)
app.get("/api/recipes", (req, res) => {
  try {
    const file1 = path.join(process.cwd(), "data", "recipes.json");
    const file2 = path.join(process.cwd(), "src", "data", "recipes.json");
    if (fs.existsSync(file1)) {
      const recipes = JSON.parse(fs.readFileSync(file1, "utf8"));
      return res.json({ ok: true, recipes });
    } else if (fs.existsSync(file2)) {
      const recipes = JSON.parse(fs.readFileSync(file2, "utf8"));
      return res.json({ ok: true, recipes });
    } else {
      return res.status(404).json({ ok: false, message: "recipes.json not found on server" });
    }
  } catch (err) {
    console.error("GET /api/recipes error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Start server
app.listen(PORT, () => {
  console.log(`JSON-file server listening on http://localhost:${PORT}`);
});
