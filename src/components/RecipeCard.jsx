// src/components/RecipeCard.jsx
import React, { useState } from "react";
import RecipeDetailModal from "./RecipeDetailModal";

export default function RecipeCard({ recipe }) {
  const [open, setOpen] = useState(false);

  const titleKey = recipe.id ?? recipe.title ?? recipe.name;

  return (
    <>
      <article className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <button onClick={() => setOpen(true)} className="text-left w-full">
          <img src={recipe.image || "/src/assets/placeholder.jpg"} alt={recipe.title || recipe.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-1">{recipe.title ?? recipe.name}</h3>
            <div className="text-sm text-muted mb-2">
              {recipe.diet ? (Array.isArray(recipe.diet) ? recipe.diet.join(", ") : recipe.diet) : "—"} • {recipe.time ?? recipe.cookingTime ?? recipe.duration ?? "—"} min
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full border text-sm">Nutrition</button>
              <button className="px-3 py-1 rounded-full border text-sm">View</button>
            </div>
          </div>
        </button>
      </article>

      <RecipeDetailModal open={open} onClose={() => setOpen(false)} recipe={recipe} />
    </>
  );
}
