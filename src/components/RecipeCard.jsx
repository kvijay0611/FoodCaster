// src/components/RecipeCard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RecipeCard({ recipe, onOpen }) {
  const { current } = useAuth();
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);
  const [userRating, setUserRating] = useState(0); // local optimistic user rating
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`${API}/api/rate/${encodeURIComponent(recipe.id)}`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data && data.ok) {
          setAvg(Number(data.average || 0));
          setTotal(Number(data.total || 0));
        }
      })
      .catch(() => {});
    return () => (mounted = false);
  }, [recipe.id]);

  // Handle star click (no optimistic avg change - wait server response)
  const handleRate = async (value) => {
    if (!current) {
      alert("Please sign in to rate recipes.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("fc_token");
      const res = await fetch(`${API}/api/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipeId: recipe.id, rating: value }),
      });
      const data = await res.json();
      if (data && data.ok) {
        // Server already applied toggle logic (same rating -> removed)
        setAvg(Number(data.average || 0));
        setTotal(Number(data.total || 0));
        // toggle userRating locally based on previous state
        setUserRating(prev => (prev === value ? 0 : value));
      } else {
        console.warn("Rating request failed", data);
      }
    } catch (err) {
      console.error("Rating error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-2xl p-4 flex flex-col">
      <img src={recipe.image} alt={recipe.title} className="w-full h-40 object-cover rounded-lg mb-3" />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{recipe.title}</h3>
        <span className="text-sm text-gray-500">{recipe.time ?? "—"} min</span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{recipe.description}</p>

      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {[1,2,3,4,5].map(v => {
            const filled = userRating >= v;
            return (
              <button
                key={v}
                onClick={() => handleRate(v)}
                disabled={loading}
                aria-label={`Rate ${v} star${v>1?"s":""}`}
                className={`text-2xl leading-none px-1 transition-transform ${
                  filled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                } ${loading ? "opacity-60 cursor-wait" : "hover:scale-110"}`}
                type="button"
              >
                ★
              </button>
            );
          })}
        </div>

        <div className="text-sm text-gray-600">
          avg: {avg ? Number(avg).toFixed(1) : "—"} {total ? `(${total})` : ""}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => onOpen && onOpen(recipe)} className="px-3 py-2 rounded-full border text-sm">View</button>
        <button className="px-3 py-2 rounded-full border text-sm">Nutrition</button>
      </div>
    </div>
  );
}
