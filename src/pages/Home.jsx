import React, { useEffect, useMemo, useState } from "react";
import Hero from "../components/Hero";
import RecipeCard from "../components/RecipeCard";
import Contact from "../components/Contact";
import ImageDetect from "../components/ImageDetect";
import { useAuth } from "../contexts/AuthContext"; // if you use AuthContext
import recipesData from "../data/recipes.json";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Home() {
  const [query, setQuery] = useState("");
  const [dietFilter, setDietFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [detectedIngredients, setDetectedIngredients] = useState([]); // array of strings
  const [filtered, setFiltered] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // If you have an AuthContext that exposes a token, prefer that.
  // Otherwise we'll fall back to localStorage token.
  let auth = null;
  try {
    // useAuth is a hook — when present it returns auth state
    auth = useAuth ? useAuth() : null;
  } catch (e) {
    // ignore if hook not available or not implemented
    auth = null;
  }
  const token = (auth && auth.token) || localStorage.getItem("auth_token") || null;

  // initial seed: show first 25 recipes
  useEffect(() => {
    setFiltered(recipesData.slice(0, 25));
  }, []);

  // recompute filtered list when filters/change
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    const detectors = (detectedIngredients || []).map((d) => String(d).toLowerCase()).filter(Boolean);

    let list = recipesData.slice();

    // diet
    if (dietFilter !== "all") {
      list = list.filter((r) => {
        const diets = Array.isArray(r.diet)
          ? r.diet.map((d) => String(d).toLowerCase())
          : [String(r.diet || "").toLowerCase()];
        return diets.some((d) => d && d.includes(dietFilter));
      });
    }

    // time
    if (timeFilter !== "all") {
      const max = Number(timeFilter);
      list = list.filter((r) => {
        const t = Number(r.time ?? r.cookingTime ?? r.duration ?? 0);
        return t && t <= max;
      });
    }

    // difficulty
    if (difficultyFilter !== "all") {
      list = list.filter((r) => String(r.difficulty || "").toLowerCase().includes(difficultyFilter));
    }

    // text search
    if (q) {
      list = list.filter((r) => {
        const title = (r.title || r.name || "").toLowerCase();
        const ingredientText = (Array.isArray(r.ingredients) ? r.ingredients.join(" ") : r.ingredients || "").toLowerCase();
        return title.includes(q) || ingredientText.includes(q);
      });
    }

    // detected ingredient filter (must contain at least one)
    if (detectors.length > 0) {
      list = list.filter((r) => {
        const ingredientText = (Array.isArray(r.ingredients) ? r.ingredients.join(" ") : r.ingredients || "").toLowerCase();
        return detectors.some((d) => d && ingredientText.includes(d));
      });
    }

    setFiltered(list.slice(0, 25));
  }, [query, dietFilter, timeFilter, difficultyFilter, detectedIngredients]);

  // fetch suggestions for the current user (or global top-rated if not logged)
  useEffect(() => {
    let mounted = true;
    async function loadSuggestions() {
      setSuggestionsLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/suggestions`, { headers });
        const data = await res.json();
        if (!mounted) return;
        if (data?.ok && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn("Failed loading suggestions:", err);
        if (mounted) setSuggestions([]);
      } finally {
        if (mounted) setSuggestionsLoading(false);
      }
    }
    loadSuggestions();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Generate Recipes button behaviour - ping backend then scroll
  const handleGenerate = async () => {
    try {
      await fetch(`${API_BASE}/api/health`);
    } catch (err) {
      // ignore health failures — still scroll to recipes
      console.warn("Backend health check failed:", err);
    } finally {
      const el = document.getElementById("recipes");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const diets = useMemo(() => ["all", "vegetarian", "non-veg", "gluten-free", "dairy-free"], []);
  const times = useMemo(() => ["all", "15", "30", "60"], []);
  const difficulties = useMemo(() => ["all", "easy", "medium", "hard"], []);

  return (
    <div>
      <Hero onGenerate={handleGenerate} />

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="text"
              placeholder="Search recipes or ingredients (e.g., tomato, egg)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2"
              aria-label="Search recipes"
            />

            <select value={dietFilter} onChange={(e) => setDietFilter(e.target.value)} className="border rounded-lg px-3 py-2" aria-label="Filter by diet">
              {diets.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All diets" : d}
                </option>
              ))}
            </select>

            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="border rounded-lg px-3 py-2" aria-label="Filter by time">
              <option value="all">Cooking Time</option>
              <option value="15">≤ 15 min</option>
              <option value="30">≤ 30 min</option>
              <option value="60">≤ 60 min</option>
            </select>

            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="border rounded-lg px-3 py-2" aria-label="Filter by difficulty">
              {difficulties.map((d) => (
                <option key={d} value={d}>{d === "all" ? "Any difficulty" : d}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setQuery("");
                setDetectedIngredients([]);
                setDietFilter("all");
                setTimeFilter("all");
                setDifficultyFilter("all");
              }}
              className="px-4 py-2 rounded-full border"
            >
              Reset
            </button>
          </div>

          {/* ImageDetect handles file upload + manual typing and calls onDetect */}
          <div className="mt-4">
            <ImageDetect onDetect={(items) => setDetectedIngredients(items)} />
          </div>

          {/* Detected ingredients pills */}
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Detected ingredients</div>
            <div className="flex flex-wrap gap-2">
              {detectedIngredients && detectedIngredients.length > 0 ? (
                detectedIngredients.map((ing, idx) => (
                  <span key={ing + idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm bg-white">
                    {ing}
                  </span>
                ))
              ) : (
                <div className="text-sm text-gray-400">—</div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions (personalized or top-rated fallback) */}
        {suggestions && suggestions.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Recommended for you</h2>
              {suggestionsLoading && <div className="text-sm text-gray-500">Loading…</div>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((r) => (
                <RecipeCard key={r.id ?? r.title ?? r.name} recipe={r} />
              ))}
            </div>
          </section>
        )}

        <section id="recipes" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length ? (
            filtered.map((r) => <RecipeCard key={r.id ?? r.title ?? r.name} recipe={r} />)
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">No recipes found matching your filters.</div>
          )}
        </section>
      </section>

      <Contact />
    </div>
  );
}
