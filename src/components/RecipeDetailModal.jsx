// src/components/RecipeDetailModal.jsx
import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RecipeDetailModal({ recipe, onClose }) {
  const [servings, setServings] = useState(recipe?.servings || 3);
  const [rating, setRating] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  // Load ratings from backend safely
  useEffect(() => {
    if (!recipe?.id) return;
    async function fetchRating() {
      try {
        const res = await axios.get(`${API_BASE}/api/ratings/recipe/${recipe.id}`);
        if (res.data?.ok) {
          setAvg(res.data.stats.avg || 0);
          setCount(res.data.stats.count || 0);
        }
      } catch (err) {
        console.warn("Rating fetch failed:", err.message);
      }
    }
    fetchRating();
  }, [recipe?.id]);

  // Handle user rating
  const handleRate = async (value) => {
    setRating(value); // instant UI feedback
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
      console.warn("Rate submit failed:", err.message);
    }
  };

  if (!recipe) return null;

  // Simple nutrition recalculation
  const factor = servings / (recipe.servings || 3);
  const nutrition = recipe.nutrition || {
    calories: 560,
    protein: 10,
    carbs: 88,
    fat: 16,
  };

  const calc = (n) => (n * factor).toFixed(2);

  return (
    <ModalWrapper open={Boolean(recipe)} onClose={onClose}>
      <div className="flex flex-col lg:flex-row gap-6">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full lg:w-1/2 h-64 object-cover rounded-lg"
        />

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold">{recipe.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-black"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-3">Steps</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-4">
            {recipe.steps?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          {/* Rating */}
          <div className="mb-4">
            <p className="font-semibold mb-1">Rate this recipe</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleRate(val)}
                  className={`text-xl ${
                    val <= rating ? "text-yellow-400" : "text-gray-400"
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

          {/* Nutrition info */}
          <div className="border-t pt-3 mt-2">
            <p className="font-semibold mb-2">Nutrition</p>
            <p className="text-sm text-gray-600 mb-1">
              Per serving (approx):
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>calories: {calc(nutrition.calories)} ({nutrition.calories} for 3 servings)</li>
              <li>protein: {calc(nutrition.protein)} ({nutrition.protein} for 3 servings)</li>
              <li>carbs: {calc(nutrition.carbs)} ({nutrition.carbs} for 3 servings)</li>
              <li>fat: {calc(nutrition.fat)} ({nutrition.fat} for 3 servings)</li>
            </ul>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
