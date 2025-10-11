import React from "react";

const diets = ["All", "vegetarian", "vegan", "gluten-free", "non-veg"];
const difficulties = ["All", "easy", "medium", "hard"];

export default function FilterBar({ filters, setFilters }){
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex gap-3 flex-wrap">
        {diets.map(d => (
          <button key={d}
            onClick={() => setFilters({...filters, diet: d})}
            className={`px-3 py-2 rounded-full border ${filters.diet === d ? "bg-black text-white" : "bg-white text-gray-700"}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-center pt-2 sm:pt-0">
        {difficulties.map(d => (
          <button key={d}
            onClick={() => setFilters({...filters, difficulty: d})}
            className={`px-3 py-2 rounded-full border ${filters.difficulty === d ? "bg-black text-white" : "bg-white text-gray-700"}`}>
            {d}
          </button>
        ))}

        <label className="text-sm text-muted">Max time (mins):</label>
        <input type="number" min="1" placeholder="999" className="w-20 px-2 py-1 border rounded" onChange={(e)=>setFilters({...filters, maxTime: e.target.value || 999})} />
      </div>
    </div>
  );
}
