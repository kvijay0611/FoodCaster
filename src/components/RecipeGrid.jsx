import React from "react";
import RecipeCard from "./RecipeCard";

export default function RecipeGrid({ recipes }){
  // ensure at most 25 displayed
  const shown = (recipes || []).slice(0, 25);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {shown.map(r => <RecipeCard key={r.id || r.title} recipe={r} />)}
    </div>
  );
}
