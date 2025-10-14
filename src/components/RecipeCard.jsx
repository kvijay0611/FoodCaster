// src/components/RecipeCard.jsx
import React, { useEffect, useState } from "react";
import RecipeDetailModal from "./RecipeDetailModal";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Minimal, robust recipe card: shows image, title, tiny star preview, time,
 * and two buttons: View (opens modal) and Nutrition (also opens modal).
 * It fetches rating stats for display (avg/count) but will not break if backend is down.
 */
export default function RecipeCard({ recipe }) {
  const { current } = useAuth();
  const [open, setOpen] = useState(false);
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!recipe?.id) {
      setAvg(null);
      setCount(0);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/ratings/recipe/${encodeURIComponent(recipe.id)}`);
        // Accept a couple shapes
        if (res?.data?.ok) {
          if (res.data.stats) {
            if (mounted) {
              setAvg(typeof res.data.stats.avg !== "undefined" ? res.data.stats.avg : null);
              setCount(typeof res.data.stats.count !== "undefined" ? res.data.stats.count : 0);
            }
          } else {
            // fallback shape: { ok:true, average, total }
            if (mounted) {
              setAvg(typeof res.data.average !== "undefined" ? res.data.average : null);
              setCount(typeof res.data.total !== "undefined" ? res.data.total : 0);
            }
          }
        }
      } catch (err) {
        // ignore network error — just show placeholder
        if (mounted) {
          setAvg(null);
          setCount(0);
        }
      }
    })();
    return () => { mounted = false; };
  }, [recipe]);

  if (!recipe) return null;

  // simple star preview (non-interactive)
  const avgVal = typeof avg === "number" ? avg : null;
  const fullStars = avgVal ? Math.round(avgVal) : 0;

  return (
    <>
      <article className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="overflow-hidden rounded-xl">
          <img
            src={recipe.image || "/src/assets/placeholder.jpg"}
            alt={recipe.title || recipe.name}
            className="w-full h-40 object-cover"
          />
        </div>

        <div className="mt-4">
          <h3 className="text-xl font-semibold">{recipe.title || recipe.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-muted">{(recipe.time || recipe.cookingTime) ? `${recipe.time || recipe.cookingTime} min` : ""}</div>
            <div className="text-sm text-muted">{Array.isArray(recipe.diet) ? recipe.diet.join(", ") : (recipe.diet || "")}</div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              { [1,2,3,4,5].map((i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i <= fullStars ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" className={i <= fullStars ? "text-yellow-400" : "text-gray-300"}>
                  <path d="M12 .587l3.668 7.431L24 9.75l-6 5.844 1.416 8.266L12 19.75 4.584 23.86 6 15.594 0 9.75l8.332-1.732z"/>
                </svg>
              )) }
            </div>
            <div className="text-sm text-gray-500">avg: { avgVal !== null ? Number(avgVal).toFixed(1) : "—" } { count ? `(${count})` : "" }</div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-full border hover:bg-gray-50"
            >
              View
            </button>

            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-full border hover:bg-gray-50"
            >
              Nutrition
            </button>
          </div>
        </div>
      </article>

      {/* Modal: the same modal component your app uses for details */}
      <RecipeDetailModal open={open} onClose={() => setOpen(false)} recipe={recipe} />
    </>
  );
}
