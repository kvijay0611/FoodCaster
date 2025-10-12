// src/components/RecipeCard.jsx
import React, { useState } from "react";
import RecipeDetailModal from "./RecipeDetailModal";

export default function RecipeCard({ recipe }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article onClick={() => setOpen(true)} style={{ cursor: "pointer", border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
        <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
        <div style={{ padding: 12 }}>
          <h3 style={{ margin: 0 }}>{recipe.title}</h3>
          <div style={{ color: "#666", marginTop: 6 }}>{(recipe.diet || "").toString()}</div>
        </div>
      </article>

      <RecipeDetailModal open={open} onClose={() => setOpen(false)} recipe={recipe} />
    </>
  );
}
