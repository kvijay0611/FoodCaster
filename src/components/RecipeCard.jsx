import React, { useState } from "react";
import NutritionCard from "./NutritionCard";

export default function RecipeCard({ recipe }){
  const [open, setOpen] = useState(false);

  const title = recipe.title || recipe.name || "Recipe";
  const diet = recipe.diet || [];
  const time = recipe.time || recipe.cookingTime || 0;

  return (
    <article className="bg-white rounded-2xl overflow-hidden border hover:shadow transition">
      <img src={recipe.image || "/src/assets/placeholder.jpg"} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-muted">
          <span>{Array.isArray(diet) ? diet.join(", ") : diet}</span>
          <span>{time} min</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => setOpen(!open)} className="px-3 py-1 rounded-full border text-sm">Nutrition</button>
          <button className="px-3 py-1 rounded-full border text-sm">View</button>
        </div>

        {open && <div className="mt-4"><NutritionCard nutrition={recipe.nutrition}/></div>}
      </div>
    </article>
  );
}
