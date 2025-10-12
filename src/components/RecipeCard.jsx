// src/components/RecipeCard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * RecipeCard
 * Props:
 *  - recipe: object (fields used: id/title/name/image/ingredients/steps/diet/time/difficulty/nutrition)
 */
export default function RecipeCard({ recipe }) {
  const { current, toggleFavorite, getFavorites } = useAuth();

  // canonical id for favorites: prefer recipe.id then title/name fallback
  const id = recipe?.id ?? recipe?.title ?? recipe?.name ?? JSON.stringify(recipe).slice(0, 40);

  // UI state
  const [fav, setFav] = useState(false);
  const [open, setOpen] = useState(false); // detail modal
  const [loadingFav, setLoadingFav] = useState(false);

  // Initialize favorite state when component mounts or when auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!current) {
          if (mounted) setFav(false);
          return;
        }
        const favs = await getFavorites();
        if (mounted) setFav(Array.isArray(favs) ? favs.includes(String(id)) : false);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        if (mounted) setFav(false);
      }
    })();
    return () => { mounted = false; };
  }, [current, id, getFavorites]);

  // Favorite toggle handler
  const handleFav = async (e) => {
    e?.stopPropagation();
    // If not signed in, open auth modal via event (Navbar listens for this)
    if (!current) {
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
      return;
    }

    setLoadingFav(true);
    try {
      const res = await toggleFavorite(String(id));
      if (res?.ok) {
        // toggle UI state based on server favorites
        setFav(Array.isArray(res.favorites) ? res.favorites.includes(String(id)) : !fav);
      } else {
        console.error("toggleFavorite failed:", res?.message);
      }
    } catch (err) {
      console.error("toggleFavorite error:", err);
    } finally {
      setLoadingFav(false);
    }
  };

  // Derived safe values
  const image = recipe?.image || recipe?.photo || "/src/assets/placeholder.jpg";
  const title = recipe?.title || recipe?.name || "Untitled Recipe";
  const diet = Array.isArray(recipe?.diet) ? recipe.diet.join(", ") : recipe?.diet || "—";
  const time = recipe?.time ?? recipe?.cookingTime ?? recipe?.duration ?? "—";
  const difficulty = recipe?.difficulty ?? "—";

  // Modal content helpers
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
    : (typeof recipe?.ingredients === "string" ? recipe.ingredients.split(",").map(s => s.trim()) : (recipe?.ingredientList || []));

  const steps = Array.isArray(recipe?.steps)
    ? recipe.steps
    : (typeof recipe?.instructions === "string" ? recipe.instructions.split("\n").map(s => s.trim()).filter(Boolean) : (recipe?.directions || []));

  const nutrition = recipe?.nutrition || recipe?.nutritionInfo || null;

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition cursor-pointer relative"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") setOpen(true); }}
      >
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/src/assets/placeholder.jpg"} />
        </div>

        {/* favorite button */}
        <button
          onClick={handleFav}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-3 right-3 bg-white/90 p-2 rounded-full border shadow-sm hover:scale-105 transition"
          title={current ? (fav ? "Saved" : "Save") : "Sign in to save"}
        >
          {loadingFav ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : (
            <span style={{ color: fav ? "#e11d48" : "#444" }}>{fav ? "♥" : "♡"}</span>
          )}
        </button>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center justify-between mt-2 text-sm text-muted text-gray-600">
            <div>{diet}</div>
            <div>{time} min</div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              className="px-3 py-1 rounded-full border text-sm"
            >
              View
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); /* placeholder for Nutrition UI if you have it */ }}
              className="px-3 py-1 rounded-full border text-sm"
            >
              Nutrition
            </button>
          </div>
        </div>
      </article>

      {/* Detail Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 p-4 overflow-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start md:items-center justify-between gap-4">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="mt-2 text-sm text-gray-600">
                  {diet} • {difficulty} • {time} min
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border">Close</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="w-full h-56 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={image} alt={title} className="w-full h-full object-cover" onError={(e)=>e.currentTarget.src="/src/assets/placeholder.jpg"} />
                </div>

                {/* Nutrition facts box if available */}
                {nutrition && (
                  <div className="mt-4 border rounded-lg p-4 text-sm text-gray-700">
                    <h4 className="font-semibold mb-2">Nutrition Facts</h4>
                    {Object.entries(nutrition).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs py-1">
                        <div className="capitalize">{k.replace(/_/g, " ")}</div>
                        <div>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <section>
                  <h4 className="text-lg font-semibold mb-3">Ingredients</h4>
                  {ingredients && ingredients.length ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {ingredients.map((ing, idx) => (
                        <li key={idx} className="text-sm">{String(ing)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400">No ingredient list available.</div>
                  )}
                </section>

                <section className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Steps</h4>
                  {steps && steps.length ? (
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      {steps.map((s, i) => (
                        <li key={i} className="text-sm">{String(s)}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-sm text-gray-400">No instructions available.</div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
