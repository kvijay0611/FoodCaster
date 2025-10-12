// src/components/RecipeDetailModal.jsx
import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const [servings, setServings] = useState(recipe?.servings || 3);
  const [ratingSelected, setRatingSelected] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setServings(recipe?.servings || 3);
    setRatingSelected(0);
    setAvg(0);
    setCount(0);
    if (!recipe?.id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/ratings/recipe/${encodeURIComponent(recipe.id)}`, { timeout: 3000 });
        if (mounted && res.data?.ok) {
          setAvg(res.data.stats?.avg ?? 0);
          setCount(res.data.stats?.count ?? 0);
        }
      } catch (err) {
        // backend might not exist — that's ok, we fallback to 0
      }
    })();
    return () => (mounted = false);
  }, [recipe]);

  const handleRate = async (value) => {
    setRatingSelected(value); // immediate UI feedback
    try {
      // try post to backend (if exists)
      await axios.post(`${API_BASE}/api/ratings/add`, { recipeId: recipe.id, rating: value });
      // fetch updated stats
      const res = await axios.get(`${API_BASE}/api/ratings/recipe/${encodeURIComponent(recipe.id)}`);
      if (res.data?.ok) {
        setAvg(res.data.stats.avg ?? 0);
        setCount(res.data.stats.count ?? 0);
      }
    } catch (err) {
      // backend not present -> just update UI locally (count not persistent)
      setAvg((prev) => ((prev * count + value) / (count + 1)) || value);
      setCount((c) => c + 1);
    }
  };

  if (!recipe) return null;

  const nutrition = recipe.nutrition || {};
  const origServ = recipe.servings || 3;
  const factor = servings / origServ;
  const scaled = (n) => (Number(n || 0) * factor).toFixed(2);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div style={{ display: "flex", gap: 20, flexDirection: "row", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <img src={recipe.image || recipe.img || "/src/assets/placeholder.jpg"} alt={recipe.title} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 8 }} />
          <h2 style={{ marginTop: 12 }}>{recipe.title || recipe.name}</h2>

          <div style={{ marginTop: 12 }}>
            <strong>Servings</strong>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <button onClick={() => setServings(s => Math.max(1, s - 1))}>-</button>
              <div style={{ padding: "6px 10px", border: "1px solid #eee", borderRadius: 6 }}>{servings}</div>
              <button onClick={() => setServings(s => s + 1)}>+</button>
              <div style={{ color: "#666", marginLeft: 12 }}>Original: {origServ}</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Ingredients</strong>
            <ul>
              {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((i, idx) => <li key={idx}>{typeof i === "string" ? i : JSON.stringify(i)}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ width: 420 }}>
          <div>
            <strong>Steps</strong>
            <ol>
              {(Array.isArray(recipe.steps) ? recipe.steps : [recipe.steps]).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Rate this recipe</strong>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => handleRate(n)} style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", background: n <= ratingSelected ? "#ffcc00" : "#fff" }}>
                  ★
                </button>
              ))}
              <span style={{ marginLeft: 8 }}>avg: {Number(avg).toFixed(1)} ({count})</span>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Nutrition</strong>
            <div style={{ marginTop: 8 }}>
              <div>Per serving (approx):</div>
              <ul>
                <li>calories: {scaled(nutrition.calories)} ({nutrition.calories || "—"} for {origServ} servings)</li>
                <li>protein: {scaled(nutrition.protein)} ({nutrition.protein || "—"} for {origServ} servings)</li>
                <li>carbs: {scaled(nutrition.carbs)} ({nutrition.carbs || "—"} for {origServ} servings)</li>
                <li>fat: {scaled(nutrition.fat)} ({nutrition.fat || "—"} for {origServ} servings)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
