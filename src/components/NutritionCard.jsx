import React from "react";

export default function NutritionCard({ nutrition }){
  if(!nutrition) return <div className="text-sm text-muted">Nutrition data not available</div>;
  return (
    <div className="border p-3 rounded-md text-sm bg-gray-50">
      <div className="grid grid-cols-2 gap-2">
        <div>Calories</div><div className="text-right font-medium">{nutrition.calories}</div>
        <div>Protein (g)</div><div className="text-right">{nutrition.protein}</div>
        <div>Carbs (g)</div><div className="text-right">{nutrition.carbs}</div>
        <div>Fat (g)</div><div className="text-right">{nutrition.fat}</div>
      </div>
    </div>
  );
}
