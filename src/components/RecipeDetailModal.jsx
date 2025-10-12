import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NutritionCard from "./NutritionCard";

export default function RecipeDetailModal({ open, onClose, recipe }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      // focus for accessibility
      dialogRef.current?.focus();
      document.body.style.overflow = "hidden"; // prevent background scroll
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  // safe getters with fallbacks
  const title = recipe?.title || recipe?.name || "Recipe";
  const image = recipe?.image || "/src/assets/placeholder.jpg";
  const ingredients = recipe?.ingredients || recipe?.ingredientList || recipe?.ing || [];
  const steps = recipe?.steps || recipe?.instructions || recipe?.method || [];
  const nutrition = recipe?.nutrition || recipe?.nutrients || null;
  const time = recipe?.time || recipe?.cookingTime || recipe?.duration || "";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} details`}
          tabIndex={-1}
          ref={dialogRef}
          className="bg-white rounded-2xl shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[80vh] overflow-auto"
          initial={{ y: 30, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <img src={image} alt={title} className="w-full h-72 md:h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none" />
            </div>

            <div className="md:w-1/2 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{title}</h2>
                  <div className="text-sm text-muted mt-1">{recipe?.diet ? (Array.isArray(recipe.diet) ? recipe.diet.join(", ") : recipe.diet) : ""} • {time} {time ? "min" : ""}</div>
                </div>

                <div className="ml-auto flex gap-2">
                  <button onClick={onClose} className="px-3 py-1 rounded-full border">Close</button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  {ingredients && ingredients.length ? (
                    <ul className="list-disc list-inside text-sm text-muted">
                      {ingredients.map((ing, i) => <li key={i}>{typeof ing === "string" ? ing : (ing.name || JSON.stringify(ing))}</li>)}
                    </ul>
                  ) : <p className="text-sm text-muted">No ingredient list available.</p>}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Steps</h3>
                  {steps && steps.length ? (
                    <ol className="list-decimal list-inside text-sm text-muted space-y-2">
                      {steps.map((s, i) => <li key={i}>{typeof s === "string" ? s : (s.step || s.description || JSON.stringify(s))}</li>)}
                    </ol>
                  ) : <p className="text-sm text-muted">No steps available.</p>}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Nutrition</h3>
                <NutritionCard nutrition={nutrition} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
