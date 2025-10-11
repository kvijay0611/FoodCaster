import React, { useMemo, useState } from "react";
import Hero from "../components/Hero";
import FilterBar from "../components/FilterBar";
import RecipeGrid from "../components/RecipeGrid";
import ImageDetect from "../components/ImageDetect";
import recipesData from "../data/recipes.json";

export default function Home(){
  const [filters, setFilters] = useState({
    diet: "All",
    difficulty: "All",
    maxTime: 999
  });

  // when image detect returns tags, we can update filters (example: set vegetarian)
  const handleDetect = (tags) => {
    // example heuristics
    if(!tags) return;
    if(tags.includes("tofu") || tags.includes("lentil") || tags.includes("basil")) {
      setFilters((p) => ({ ...p, diet: "vegetarian" }));
    }
  };

  const recipes = useMemo(() => {
    return recipesData.filter(r => {
      if(filters.diet !== "All") {
        // many recipes have diet as array or string: normalize
        const d = Array.isArray(r.diet) ? r.diet.map(x=>x.toLowerCase()) : String(r.diet || "").toLowerCase();
        if(Array.isArray(d)) {
          if(!d.includes(filters.diet.toLowerCase())) return false;
        } else {
          if(!d.includes(filters.diet.toLowerCase())) return false;
        }
      }
      if(filters.difficulty !== "All") {
        if(String(r.difficulty || "").toLowerCase() !== filters.difficulty.toLowerCase()) return false;
      }
      if(Number(r.time || r.cookingTime || 0) > Number(filters.maxTime || 999)) return false;
      return true;
    });
  }, [filters]);

  return (
    <div>
      <Hero />
      <div className="max-w-6xl mx-auto px-6">
        <div className="mt-8">
          <FilterBar filters={filters} setFilters={setFilters}/>
        </div>

        <div className="mt-6">
          <ImageDetect onDetect={handleDetect}/>
        </div>

        <section id="recipes" className="mt-10 mb-20">
          <h2 className="text-3xl font-semibold mb-6">Explore Recipes</h2>
          <RecipeGrid recipes={recipes} />
        </section>
      </div>
    </div>
  );
}
