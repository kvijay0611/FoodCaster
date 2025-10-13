import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Helper: parse a numeric token (integer, decimal, simple fraction like "1/2")
 * Returns number or null.
 */
function parseNumberToken(token) {
  // fraction like "1/2" or "3/4"
  if (token.includes("/")) {
    const parts = token.split("/");
    if (parts.length === 2) {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (!isNaN(a) && !isNaN(b) && b !== 0) return a / b;
    }
  }
  const n = Number(token.replace(/[^\d.-]/g, "")); // strip non numeric
  return isNaN(n) ? null : n;
}

/**
 * Replace numeric tokens in a step string with scaled versions.
 * This is a best-effort approach — looks for tokens that begin with a number (e.g., "1", "1.5", "1/2", "200g", "200 grams")
 */
function scaleStepText(step, factor) {
  // Split on spaces and punctuation but keep punctuation boundary
  // We will detect tokens that contain numbers and scale just that numeric portion
  return step.replace(
    /(\d+(?:\.\d+)?(?:\/\d+)?(?:\s?(?:g|grams|kg|ml|l|tbsp|tsp|cup|cups|cup\.)?)?)/gi,
    (match) => {
      // Extract numeric part from match:
      const numPartMatch = match.match(/^\d+(?:\.\d+)?(?:\/\d+)?/);
      if (!numPartMatch) return match;
      const numPart = numPartMatch[0];
      const parsed = parseNumberToken(numPart);
      if (parsed === null) return match;

      const scaled = parsed * factor;
      // Format: if it's a near-integer -> show integer
      const rounded = Math.round(scaled * 100) / 100;
      const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
      // replace numeric portion only, keep units if any
      return match.replace(numPart, display);
    }
  );
}

/**
 * Scale nutrition value (simple multiplication and rounding).
 */
function scaleNumeric(n, factor) {
  const v = Number(n || 0) * factor;
  const rounded = Math.round(v * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
}

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const { current, toggleFavorite, getFavorites } = useAuth();
  const [servings, setServings] = useState(recipe?.servings || 1);
  const [ratingSelected, setRatingSelected] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    setServings(recipe.servings || 1);
    setRatingSelected(0);
    setAvg(0);
    setCount(0);
    setIsFav(false);

    async function fetchData() {
      try {
        const res = await axios.get(`${API_BASE}/api/ratings/recipe/${recipe.id}`);
        if (res.data?.ok) {
          setAvg(res.data.stats.avg ?? 0);
          setCount(res.data.stats.count ?? 0);
        }
      } catch (err) {
        // ignore if backend not available
      }

      try {
        const favs = await getFavorites();
        if (Array.isArray(favs) && favs.includes(recipe.id)) setIsFav(true);
      } catch (err) {}
    }

    fetchData();
  }, [recipe]);

  // update servings when recipe changes
  useEffect(() => {
    if (!recipe) return;
    setServings(recipe.servings || 1);
  }, [recipe]);

  const handleRate = async (value) => {
    setRatingSelected(value);
    try {
      const res = await axios.post(`${API_BASE}/api/ratings/add`, {
        recipeId: recipe.id,
        rating: value,
      });
      if (res.data?.ok) {
        setAvg(res.data.stats.avg);
        setCount(res.data.stats.count);
      }
    } catch (err) {
      // best-effort local update if backend unavailable
      const prevAvg = avg * count;
      const newCount = count + 1;
      const newAvg = (prevAvg + value) / newCount;
      setAvg(newAvg);
      setCount(newCount);
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await toggleFavorite(recipe.id);
      if (res.ok) {
        setIsFav((prev) => !prev);
      } else {
        alert(res.message || "Please log in to save favorites");
      }
    } catch (err) {
      console.error("Fav toggle failed:", err);
    }
  };

  if (!recipe) return null;

  // scaling factor relative to original servings
  const origServ = recipe.servings || 1;
  const factor = servings / origServ;

  // scaled nutrition
  const nutrition = recipe.nutrition || {};
  const scaledNutrition = {
    calories: scaleNumeric(nutrition.calories || 0, factor),
    protein: scaleNumeric(nutrition.protein || 0, factor),
    carbs: scaleNumeric(nutrition.carbs || 0, factor),
    fat: scaleNumeric(nutrition.fat || 0, factor),
  };

  // scaled steps: best-effort number scaling inside step text
  const scaledSteps = (recipe.steps || []).map((s) => scaleStepText(s, factor));

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="max-w-5xl mx-auto p-4 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left */}
          <div className="flex-1">
            <img
              src={recipe.image || "/src/assets/placeholder.jpg"}
              alt={recipe.title || recipe.name}
              className="w-full h-56 object-cover rounded-lg"
            />

            <div className="flex items-center justify-between mt-3">
              <h2 className="text-2xl font-bold">{recipe.title || recipe.name}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-2xl text-gray-600 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <strong>Servings</strong>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="border rounded px-3 py-1"
                >
                  -
                </button>
                <div className="border px-4 py-1 rounded">{servings}</div>
                <button
                  onClick={() => setServings((s) => s + 1)}
                  className="border rounded px-3 py-1"
                >
                  +
                </button>
                <div className="text-sm text-gray-600">Original: {origServ}</div>
              </div>
            </div>

            <div className="mt-4">
              <strong>Ingredients</strong>
              <ul className="list-disc list-inside mt-2">
                {(recipe.ingredients || []).map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right */}
          <div className="flex-1">
            <div>
              <strong>Steps</strong>
              <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-700">
                {scaledSteps.map((st, idx) => (
                  <li key={idx}>{st}</li>
                ))}
              </ol>
            </div>

            <div className="mt-4">
              <strong>Rate this recipe</strong>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleRate(val)}
                    className={`text-2xl ${
                      val <= ratingSelected ? "text-yellow-400" : "text-gray-300"
                    }`}
                    aria-label={`Rate ${val}`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">avg: {Number(avg).toFixed(1)} ({count})</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleFavorite}
                className={`px-4 py-2 rounded-full border ${
                  isFav ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700"
                }`}
              >
                {isFav ? "♥ Remove Favorite" : "♡ Add to Favorites"}
              </button>
            </div>

            <div className="mt-6 border-t pt-3">
              <strong>Nutrition</strong>
              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <div>
                  calories: {scaledNutrition.calories} ({nutrition.calories || "—"} for {origServ} servings)
                </div>
                <div>
                  protein: {scaledNutrition.protein} ({nutrition.protein || "—"} for {origServ} servings)
                </div>
                <div>
                  carbs: {scaledNutrition.carbs} ({nutrition.carbs || "—"} for {origServ} servings)
                </div>
                <div>
                  fat: {scaledNutrition.fat} ({nutrition.fat || "—"} for {origServ} servings)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
