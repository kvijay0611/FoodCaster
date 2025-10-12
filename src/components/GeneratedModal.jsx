import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RecipeCard from "./RecipeCard";

export default function GeneratedModal({ open, onClose, recipes, onRegenerate }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.focus();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[80vh] overflow-auto p-6"
            initial={{ y: 30, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Generated recipes"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-semibold">Generated Recipes</h3>
                <p className="text-sm text-muted">Here are some recipes matched to your filters.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onRegenerate} className="px-4 py-2 rounded-full border">Regenerate</button>
                <button onClick={onClose} className="px-4 py-2 rounded-full bg-black text-white">Close</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes && recipes.length ? (
                recipes.map((r) => <RecipeCard key={r.id || r.title} recipe={r} />)
              ) : (
                <div className="text-center col-span-full text-muted">No recipes found for the current filters.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
