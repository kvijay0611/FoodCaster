import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function scaleIngredient(ing, factor) {
  // try to scale numeric prefixes (like "2 cups flour" -> scale 2)
  const m = ing.match(/^([\d/.]+)\s*(.*)$/);
  if (m) {
    const qty = m[1];
    const rest = m[2] || "";
    let value = 0;
    try {
      // handle fractions like 1/2
      if (qty.includes("/")) {
        const parts = qty.split("/");
        value = Number(parts[0]) / Number(parts[1]);
      } else {
        value = Number(qty);
      }
      if (!isNaN(value)) {
        const scaled = (value * factor);
        // render scaled with up to two decimals
        const display = Number.isInteger(scaled) ? scaled : parseFloat(scaled.toFixed(2));
        return `${display} ${rest}`.trim();
      }
    } catch {
      // fallback
    }
  }
  // fallback: return original if no numeric prefix
  return ing;
}

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const { token } = useAuth(); // expects AuthContext to expose token
  const [servings, setServings] = useState(recipe.servings ?? 1);
  const [rating, setRating] = useState(0);
  const [stats, setStats] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    setServings(recipe.servings ?? 1);
  }, [recipe]);

  // load recipe rating stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/api/ratings/recipe/${recipe.id ?? recipe.title ?? recipe.name}`);
        const data = await res.json();
        if (data?.ok) setStats(data.stats || { avg: 0, count: 0 });
      } catch (err) {
        // ignore
      }
    }
    loadStats();
  }, [recipe]);

  const ingredientList = Array.isArray(recipe.ingredients) ? recipe.ingredients : String(recipe.ingredients || "").split(",").map(s => s.trim()).filter(Boolean);

  const scaledIngredients = useMemo(() => {
    // compute factor relative to original servings (assume recipe.servings exists, else factor = servings)
    const orig = recipe.servings ?? 1;
    const factor = servings / orig;
    return ingredientList.map(i => scaleIngredient(i, factor));
  }, [ingredientList, servings, recipe]);

  async function submitRating(value) {
    try {
      const res = await fetch(`${API_BASE}/api/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipeId: recipe.id ?? recipe.title ?? recipe.name, rating: value }),
      });
      const data = await res.json();
      if (data?.ok) {
        setRating(value);
        setStats(data.stats || stats);
      } else {
        alert(data?.message || "Could not submit rating");
      }
    } catch (err) {
      console.error("Rate error", err);
      alert("Network error");
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-lg p-6 z-10 overflow-auto max-h-[90vh]">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold">{recipe.title ?? recipe.name}</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-6">
          <div>
            <img src={recipe.image || "/src/assets/placeholder.jpg"} alt={recipe.title || recipe.name} className="w-full h-44 object-cover rounded-lg" />
            <div className="mt-3">
              <div className="text-sm text-gray-600">Servings</div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => setServings(s => Math.max(1, s - 1))} className="px-3 py-1 border rounded">−</button>
                <input type="number" min="1" value={servings} onChange={e => setServings(Math.max(1, Number(e.target.value || 1)))} className="w-20 text-center border rounded px-2 py-1" />
                <button onClick={() => setServings(s => s + 1)} className="px-3 py-1 border rounded">+</button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Ingredients</div>
              <ul className="list-inside list-disc mt-2">
                {scaledIngredients.map((ing, i) => <li key={i} className="text-sm text-gray-700">{ing}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Steps</div>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              {(Array.isArray(recipe.steps) ? recipe.steps : String(recipe.steps || "").split("\n").filter(Boolean)).map((s, i) => (
                <li key={i} className="text-sm text-gray-700">{s}</li>
              ))}
            </ol>

            <div className="mt-4">
              <div className="text-sm font-medium">Rate this recipe</div>
              <div className="flex items-center gap-2 mt-2">
                {[1,2,3,4,5].map(v => (
                  <button
                    key={v}
                    onClick={() => submitRating(v)}
                    className={`px-2 py-1 rounded ${v <= rating ? "bg-yellow-400" : "bg-gray-100"}`}
                    aria-label={`Rate ${v}`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-3">avg: {stats.avg ?? 0} ({stats.count ?? 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
