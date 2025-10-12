// src/components/RecipeDetailModal.jsx
import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const { current, toggleFavorite, getFavorites } = useAuth();
  const [servings, setServings] = useState(recipe?.servings || 3);
  const [ratingSelected, setRatingSelected] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [isFav, setIsFav] = useState(false);

  // Load initial rating + favorites
  useEffect(() => {
    if (!recipe?.id) return;
    setServings(recipe.servings || 3);
    setRatingSelected(0);
    setAvg(0);
    setCount(0);
    setIsFav(false);

    async function fetchData() {
      try {
        // Ratings
        const res = await axios.get(`${API_BASE}/api/ratings/recipe/${recipe.id}`);
        if (res.data?.ok) {
          setAvg(res.data.stats.avg ?? 0);
          setCount(res.data.stats.count ?? 0);
        }
      } catch (_) {}

      try {
        // Favorites
        const favs = await getFavorites();
        if (favs.includes(recipe.id)) setIsFav(true);
      } catch (_) {}
    }

    fetchData();
  }, [recipe]);

  // Handle rate click
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
    } catch {
      // fallback
      setAvg((prev) => ((prev * count + value) / (count + 1)) || value);
      setCount((c) => c + 1);
    }
  };

  // Handle favorites toggle
  const handleFavorite = async () => {
    try {
      const res = await toggleFavorite(recipe.id);
      if (res.ok) {
        setIsFav((prev) => !prev);
      } else {
        alert(res.message || "Login to save favorites");
      }
    } catch (err) {
      console.error("Fav toggle failed:", err);
    }
  };

  if (!recipe) return null;

  const nutrition = recipe.nutrition || {};
  const origServ = recipe.servings || 3;
  const factor = servings / origServ;
  const scaled = (n) => (Number(n || 0) * factor).toFixed(2);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left section */}
        <div className="flex-1">
          <img
            src={recipe.image || recipe.img || "/src/assets/placeholder.jpg"}
            alt={recipe.title}
            className="w-full h-64 object-cover rounded-lg"
          />

          <div className="flex justify-between items-center mt-3">
            <h2 className="text-2xl font-bold">{recipe.title || recipe.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-lg"
            >
              ✕
            </button>
          </div>

          <div className="mt-3">
            <strong>Servings</strong>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="border px-3 py-1 rounded"
              >
                -
              </button>
              <div className="border px-4 py-1 rounded">{servings}</div>
              <button
                onClick={() => setServings((s) => s + 1)}
                className="border px-3 py-1 rounded"
              >
                +
              </button>
              <div className="text-sm text-gray-600 ml-2">
                Original: {origServ}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <strong>Ingredients</strong>
            <ul className="list-disc list-inside text-gray-700 mt-2">
              {(recipe.ingredients || []).map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right section */}
        <div className="flex-1">
          <div>
            <strong>Steps</strong>
            <ol className="list-decimal list-inside mt-2 text-gray-700 space-y-1">
              {(recipe.steps || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>

          <div className="mt-4">
            <strong>Rate this recipe</strong>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleRate(val)}
                  className={`text-2xl ${
                    val <= ratingSelected ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                avg: {avg.toFixed(1)} ({count})
              </span>
            </div>
          </div>

          {/* Favorite toggle */}
          <div className="mt-5">
            <button
              onClick={handleFavorite}
              className={`px-4 py-2 rounded-full border ${
                isFav
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {isFav ? "♥ Remove Favorite" : "♡ Add to Favorites"}
            </button>
          </div>

          <div className="mt-6 border-t pt-3">
            <strong>Nutrition</strong>
            <div className="text-sm text-gray-700 mt-2">
              <p>Per serving (approx):</p>
              <ul className="space-y-1">
                <li>
                  calories: {scaled(nutrition.calories)} (
                  {nutrition.calories || "—"} for {origServ} servings)
                </li>
                <li>
                  protein: {scaled(nutrition.protein)} (
                  {nutrition.protein || "—"} for {origServ} servings)
                </li>
                <li>
                  carbs: {scaled(nutrition.carbs)} ({nutrition.carbs || "—"} for{" "}
                  {origServ} servings)
                </li>
                <li>
                  fat: {scaled(nutrition.fat)} ({nutrition.fat || "—"} for{" "}
                  {origServ} servings)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
