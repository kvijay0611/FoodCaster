// src/components/RecipeDetailModal.jsx
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
  if (!token) return null;
  // fraction like "1/2" or "3/4"
  if (token.includes("/")) {
    const parts = token.split("/");
    if (parts.length === 2) {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (!isNaN(a) && !isNaN(b) && b !== 0) return a / b;
    }
  }
  const n = Number(token.replace(/[^\d.-]/g, ""));
  return isNaN(n) ? null : n;
}

/**
 * Replace numeric tokens in a step string with scaled versions.
 * Best-effort approach: finds tokens that begin with a number and scales them.
 */
function scaleStepText(step = "", factor = 1) {
  if (!step || factor === 1) return step;
  return step.replace(
    /(\d+(?:\.\d+)?(?:\/\d+)?(?:\s?(?:g|grams|kg|ml|l|tbsp|tsp|cup|cups|cup\.)?)?)/gi,
    (match) => {
      const numPartMatch = match.match(/^\d+(?:\.\d+)?(?:\/\d+)?/);
      if (!numPartMatch) return match;
      const numPart = numPartMatch[0];
      const parsed = parseNumberToken(numPart);
      if (parsed === null) return match;
      const scaled = parsed * factor;
      const rounded = Math.round(scaled * 100) / 100;
      const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
      return match.replace(numPart, display);
    }
  );
}

/**
 * Scale numeric n by factor and format.
 */
function scaleNumeric(n, factor) {
  const v = Number(n || 0) * factor;
  const rounded = Math.round(v * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
}

/**
 * Try GET from multiple possible endpoints, return parsed json or null.
 */
async function tryGet(urls) {
  for (const u of urls) {
    try {
      const res = await axios.get(u);
      if (res && res.data) return res.data;
    } catch (err) {
      // try next
    }
  }
  return null;
}

/**
 * Try POST to multiple endpoints; returns response data or throws.
 */
async function tryPost(urls, body, headers = {}) {
  for (const u of urls) {
    try {
      const res = await axios.post(u, body, { headers });
      if (res && res.data) return res.data;
    } catch (err) {
      // continue to next
    }
  }
  throw new Error("All POST endpoints failed");
}

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const { current, toggleFavorite, getFavorites } = useAuth();

  const [servings, setServings] = useState(recipe?.servings || 1);
  const [ratingSelected, setRatingSelected] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [isFav, setIsFav] = useState(false);

  const [ratingLoading, setRatingLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // reset local state when recipe changes or modal opens
  useEffect(() => {
    if (!recipe) return;
    setServings(recipe.servings || 1);
    setRatingSelected(0);
    setAvg(0);
    setCount(0);
    setIsFav(false);

    let mounted = true;

    // try to fetch rating stats from a couple of possible endpoints (compatibility)
    (async () => {
      const statUrls = [
        `${API_BASE}/api/rate/${encodeURIComponent(recipe.id)}`,
        `${API_BASE}/api/ratings/recipe/${encodeURIComponent(recipe.id)}`,
      ];
      const data = await tryGet(statUrls);
      if (!mounted) return;
      if (data && data.ok) {
        // support possible shapes:
        // { ok:true, average, total } OR { ok:true, stats: { avg, count } }
        if (typeof data.average !== "undefined" || typeof data.total !== "undefined") {
          setAvg(Number(data.average || 0));
          setCount(Number(data.total || 0));
        } else if (data.stats) {
          setAvg(Number(data.stats.avg || 0));
          setCount(Number(data.stats.count || 0));
        }
      }

      // check favorites (if user is logged in)
      try {
        const favs = await getFavorites();
        if (Array.isArray(favs) && favs.includes(recipe.id)) {
          setIsFav(true);
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recipe, getFavorites]);

  // sync servings if recipe updates externally
  useEffect(() => {
    if (!recipe) return;
    setServings(recipe.servings || 1);
  }, [recipe]);

  // rating handler — wait for server response (no optimistic avg changes)
  const handleRate = async (value) => {
    if (!current) {
      alert("Please log in to rate recipes.");
      return;
    }
    if (!recipe) return;
    if (ratingLoading) return;

    setRatingLoading(true);
    try {
      const token = localStorage.getItem("fc_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const postUrls = [
        `${API_BASE}/api/rate`,
        `${API_BASE}/api/ratings/add`
      ];

      // send rating, backend expected to toggle if same rating exists
      const data = await tryPost(postUrls, { recipeId: recipe.id, rating: value }, headers);

      // Accept multiple shapes:
      // { ok:true, average, total } or { ok:true, stats: { avg, count } } or { ok:true, stats }
      if (data) {
        if (typeof data.average !== "undefined" || typeof data.total !== "undefined") {
          setAvg(Number(data.average || 0));
          setCount(Number(data.total || 0));
        } else if (data.stats) {
          setAvg(Number(data.stats.avg || 0));
          setCount(Number(data.stats.count || 0));
        }
        // toggle local selected rating: if clicking same rating -> undo (server toggled)
        setRatingSelected(prev => (prev === value ? 0 : value));
      }
    } catch (err) {
      // If backend unavailable - fallback to best-effort behavior but do not double-increment avg incorrectly:
      console.warn("Rating request failed, performing local fallback:", err);
      // fallback: if no server, adjust avg conservatively:
      const prevTotal = Number(count || 0);
      const prevAvg = Number(avg || 0);
      if (prevTotal === 0) {
        setAvg(value);
        setCount(1);
      } else {
        // toggle assumption: if user didn't rate before, add else remove
        // We can't know previous, so treat as single-add if ratingSelected===0
        if (ratingSelected === 0) {
          const newCount = prevTotal + 1;
          const newAvg = (prevAvg * prevTotal + value) / newCount;
          setAvg(newAvg);
          setCount(newCount);
          setRatingSelected(value);
        } else {
          // user had a local rating -> remove it
          // compute new average removing one instance (best-effort)
          const newCount = Math.max(0, prevTotal - 1);
          const newTotalSum = prevAvg * prevTotal - ratingSelected;
          const newAvg = newCount > 0 ? newTotalSum / newCount : 0;
          setAvg(newAvg);
          setCount(newCount);
          setRatingSelected(0);
        }
      }
    } finally {
      setRatingLoading(false);
    }
  };

  // favorites handler: waits for toggleFavorite to return success
  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await toggleFavorite(recipe.id);
      // toggleFavorite from AuthContext should return { ok: true, favorites: [...] } on success
      if (res && res.ok) {
        if (Array.isArray(res.favorites)) {
          setIsFav(res.favorites.includes(recipe.id));
        } else {
          // fallback to toggling visually if backend returns ok but no list
          setIsFav(prev => !prev);
        }
      } else {
        alert(res.message || "Please log in to save favorites");
      }
    } catch (err) {
      console.error("Fav toggle failed:", err);
      alert("Failed to toggle favorite. Please try again.");
    } finally {
      setFavLoading(false);
    }
  };

  if (!recipe) return null;

  // scaling calculations
  const origServ = Number(recipe.servings || 1);
  const factor = servings / (origServ || 1);

  // Determine per-serving nutrition:
  const nutrition = recipe.nutrition || {};
  let perServing = { calories: null, protein: null, carbs: null, fat: null };

  if (nutrition.perServing && typeof nutrition.perServing === "object") {
    perServing = {
      calories: Number(nutrition.perServing.calories || 0),
      protein: Number(nutrition.perServing.protein || 0),
      carbs: Number(nutrition.perServing.carbs || 0),
      fat: Number(nutrition.perServing.fat || 0),
    };
  } else {
    // try to use total numbers and divide by original servings
    const totalServingsInData = Number(nutrition.totalServings || origServ || 1);
    if (nutrition.calories != null) perServing.calories = Number(nutrition.calories) / totalServingsInData;
    if (nutrition.protein != null) perServing.protein = Number(nutrition.protein) / totalServingsInData;
    if (nutrition.carbs != null) perServing.carbs = Number(nutrition.carbs) / totalServingsInData;
    if (nutrition.fat != null) perServing.fat = Number(nutrition.fat) / totalServingsInData;
  }

  // scaled nutritional values for selected servings
  const scaledNutrition = {
    calories: perServing.calories != null ? scaleNumeric(perServing.calories * servings, 1) : "—",
    protein: perServing.protein != null ? scaleNumeric(perServing.protein * servings, 1) : "—",
    carbs: perServing.carbs != null ? scaleNumeric(perServing.carbs * servings, 1) : "—",
    fat: perServing.fat != null ? scaleNumeric(perServing.fat * servings, 1) : "—",
    perServingDisplay: {
      calories: perServing.calories != null ? scaleNumeric(perServing.calories, 1) : "—",
      protein: perServing.protein != null ? scaleNumeric(perServing.protein, 1) : "—",
      carbs: perServing.carbs != null ? scaleNumeric(perServing.carbs, 1) : "—",
      fat: perServing.fat != null ? scaleNumeric(perServing.fat, 1) : "—",
    }
  };

  // scaled steps
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
                <button
                  onClick={() => setServings(origServ)}
                  className="ml-3 text-sm px-3 py-1 border rounded"
                >
                  Reset
                </button>
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
                    disabled={ratingLoading}
                    className={`text-2xl ${val <= ratingSelected ? "text-yellow-400" : "text-gray-300"}`}
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
                disabled={favLoading}
                className={`px-4 py-2 rounded-full border ${isFav ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700"}`}
              >
                {isFav ? "♥ Remove Favorite" : "♡ Add to Favorites"}
              </button>
            </div>

            <div className="mt-6 border-t pt-3">
              <strong>Nutrition</strong>
              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <div>
                  calories: {scaledNutrition.perServingDisplay.calories} ( {scaledNutrition.calories} for {servings} serving{servings > 1 ? "s" : ""} )
                </div>
                <div>
                  protein: {scaledNutrition.perServingDisplay.protein} ( {scaledNutrition.protein} for {servings} serving{servings > 1 ? "s" : ""} )
                </div>
                <div>
                  carbs: {scaledNutrition.perServingDisplay.carbs} ( {scaledNutrition.carbs} for {servings} serving{servings > 1 ? "s" : ""} )
                </div>
                <div>
                  fat: {scaledNutrition.perServingDisplay.fat} ( {scaledNutrition.fat} for {servings} serving{servings > 1 ? "s" : ""} )
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
