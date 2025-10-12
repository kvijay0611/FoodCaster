// src/components/RecipeDetailModal.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

export default function RecipeDetailModal({ recipe, onClose }) {
  if (!recipe) return null;

  const { rateRecipe } = useAuth();
  const [servings, setServings] = useState(recipe.servings ?? 1);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [stats, setStats] = useState({ avg: 0, count: 0 });

  // load rating stats
  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/ratings/recipe/${encodeURIComponent(recipe.id ?? recipe.title ?? recipe.name)}`);
        if (!mounted) return;
        if (res.data?.ok && res.data.stats) setStats(res.data.stats);
      } catch (err) {
        // ignore
      }
    }
    loadStats();
    return () => (mounted = false);
  }, [recipe]);

  // calculate nutrition per serving (if recipe.nutrition has numbers)
  const perServingNutrition = {};
  if (recipe.nutrition && typeof recipe.nutrition === "object") {
    Object.keys(recipe.nutrition).forEach((k) => {
      const total = Number(recipe.nutrition[k] || 0);
      perServingNutrition[k] = recipe.servings ? (total / recipe.servings) : total;
    });
  }

  const changeServing = (delta) => {
    setServings((s) => Math.max(1, s + delta));
  };

  const scaledNutrition = {};
  if (Object.keys(perServingNutrition).length) {
    Object.keys(perServingNutrition).forEach((k) => {
      scaledNutrition[k] = +(perServingNutrition[k] * servings).toFixed(2);
    });
  }

  const handleRate = async (value) => {
    if (!value || value < 1 || value > 5) return;
    setRatingLoading(true);
    try {
      const res = await rateRecipe(recipe.id ?? recipe.title ?? recipe.name, value);
      // try to refresh stats
      const statsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/ratings/recipe/${encodeURIComponent(recipe.id ?? recipe.title ?? recipe.name)}`);
      if (statsRes.data?.ok) setStats(statsRes.data.stats);
    } catch (err) {
      alert(err?.message || "Could not save rating. Make sure you're logged in.");
    } finally {
      setRatingLoading(false);
    }
  };

  // Helper to render scaled ingredients. If ingredient entries are strings, we can't scale amounts reliably — show original list.
  const renderIngredients = () => {
    // If recipe.ingredients contains objects with quantity, scale; otherwise show simple list
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length && typeof recipe.ingredients[0] === "object") {
      return recipe.ingredients.map((ing, i) => {
        const qty = Number(ing.quantity || 1);
        const scaledQty = (qty * servings / (recipe.servings || 1)).toFixed(2);
        return <li key={i}>{scaledQty} {ing.unit ?? ""} {ing.name ?? JSON.stringify(ing)}</li>;
      });
    } else {
      // string list — just show bullet list and show note about servings change
      return recipe.ingredients && recipe.ingredients.length ? recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>) : <li>No ingredients listed</li>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-6">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-600">Close</button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img src={recipe.image || recipe.img || "/src/assets/placeholder.jpg"} alt={recipe.title || recipe.name} className="w-full h-56 object-cover rounded-lg mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{recipe.title || recipe.name}</h2>

            <div className="mb-4">
              <strong>Servings</strong>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => changeServing(-1)} className="px-3 py-1 rounded border">-</button>
                <div className="px-4 py-1 border rounded">{servings}</div>
                <button onClick={() => changeServing(1)} className="px-3 py-1 rounded border">+</button>
                <div className="text-sm text-gray-500 ml-3">Original: {recipe.servings ?? "—"}</div>
              </div>
            </div>

            <div>
              <strong>Ingredients</strong>
              <ul className="list-disc ml-5 mt-2">
                {renderIngredients()}
              </ul>
              {(!Array.isArray(recipe.ingredients) || typeof recipe.ingredients[0] === "string") && (
                <p className="text-sm text-gray-500 mt-2">Note: ingredient quantities are not parseable in this dataset, servings change is informational.</p>
              )}
            </div>
          </div>

          <div>
            <div>
              <strong>Steps</strong>
              <ol className="list-decimal ml-5 mt-2">
                {Array.isArray(recipe.steps) ? recipe.steps.map((s, i) => <li key={i}>{s}</li>) : <li>{recipe.steps || "No steps provided."}</li>}
              </ol>
            </div>

            <div className="mt-4">
              <strong>Rate this recipe</strong>
              <div className="flex items-center gap-2 mt-2">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleRate(n)}
                    disabled={ratingLoading}
                    className="px-3 py-2 border rounded bg-white hover:bg-gray-50"
                    title={`Rate ${n} star${n>1?"s":""}`}
                  >
                    ★
                  </button>
                ))}
                <div className="ml-3 text-sm text-gray-600">avg: {stats.avg ?? 0} ({stats.count ?? 0})</div>
              </div>
            </div>

            <div className="mt-4">
              <strong>Nutrition</strong>
              {recipe.nutrition && typeof recipe.nutrition === "object" ? (
                <div className="mt-2 text-sm text-gray-700">
                  <div>Per serving (approx):</div>
                  <ul className="ml-5 mt-2">
                    {Object.keys(perServingNutrition).length ? (
                      Object.entries(perServingNutrition).map(([k, v]) => (
                        <li key={k}>{k}: {Number(v).toFixed(2)} ({scaledNutrition[k] ? `${scaledNutrition[k]} for ${servings} serving${servings>1?"s":""}` : ""})</li>
                      ))
                    ) : (
                      <li>No numeric nutrition data available.</li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-600">Nutrition data not available for this recipe.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
