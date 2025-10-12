// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import Hero from "../components/Hero";
import RecipeCard from "../components/RecipeCard";
import Contact from "../components/Contact";
import ImageDetect from "../components/ImageDetect";
import recipesData from "../data/recipes.json";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Home page - hero, controls, recipe grid, contact
 */
export default function Home() {
  const [query, setQuery] = useState("");
  const [dietFilter, setDietFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // all / 15 / 30 / 60
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [detectedIngredients, setDetectedIngredients] = useState([]); // array of strings
  const [filtered, setFiltered] = useState([]);

  // initial seed: show first 25 recipes
  useEffect(() => {
    setFiltered(recipesData.slice(0, 25));
  }, []);

  // recompute filtered list when filters change
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    const detectors = (detectedIngredients || []).map((d) => String(d).toLowerCase());

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
      list = list.filter((r) =>
        String(r.difficulty || "").toLowerCase().includes(difficultyFilter)
      );
    }

    // text search
    if (q) {
      list = list.filter((r) => {
        const title = (r.title || r.name || "").toLowerCase();
        const ingredientText = (
          Array.isArray(r.ingredients) ? r.ingredients.join(" ") : r.ingredients || ""
        ).toLowerCase();
        return title.includes(q) || ingredientText.includes(q);
      });
    }

    // detected ingredient filter (must contain at least one)
    if (detectors.length > 0) {
      list = list.filter((r) => {
        const ingredientText = (
          Array.isArray(r.ingredients) ? r.ingredients.join(" ") : r.ingredients || ""
        ).toLowerCase();
        return detectors.some((d) => d && ingredientText.includes(d));
      });
    }

    setFiltered(list.slice(0, 25));
  }, [query, dietFilter, timeFilter, difficultyFilter, detectedIngredients]);

  // Generate Recipes button behaviour
  const handleGenerate = async () => {
    try {
      await fetch(`${API_BASE}/api/health`);
      const el = document.getElementById("recipes");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.warn("Backend health check failed:", err);
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

            <select
              value={dietFilter}
              onChange={(e) => setDietFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Filter by diet"
            >
              {diets.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All diets" : d}
                </option>
              ))}
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Filter by time"
            >
              <option value="all">All times</option>
              <option value="15">≤ 15 min</option>
              <option value="30">≤ 30 min</option>
              <option value="60">≤ 60 min</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Filter by difficulty"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "Any difficulty" : d}
                </option>
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
        </div>

        <section id="recipes" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length ? (
            filtered.map((r) => <RecipeCard key={r.id ?? r.title ?? r.name} recipe={r} />)
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No recipes found matching your filters.
            </div>
          )}
        </section>
      </section>

      <Contact />
    </div>
  );
}
