// src/components/FavoritesModal.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import recipesData from "../data/recipes.json";
import RecipeCard from "./RecipeCard";

/**
 * FavoritesModal - robust, defensive modal that fetches favorites from server
 * Props:
 *  - open: boolean
 *  - onClose: fn
 */
export default function FavoritesModal({ open, onClose }) {
  const { current, getFavorites, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    // Reset state when opening
    setError(null);
    setFavIds([]);
    if (!current) {
      // Not signed in -> nothing to fetch
      return;
    }

    let mounted = true;
    setLoading(true);
    getFavorites()
      .then((ids) => {
        if (!mounted) return;
        // ensure array
        setFavIds(Array.isArray(ids) ? ids : []);
      })
      .catch((err) => {
        console.error("Failed to fetch favorites:", err);
        if (!mounted) return;
        setError("Failed to load favorites. Try again.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [open, current, getFavorites]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Favorites</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        {!current ? (
          <div className="text-center py-6">
            <p className="mb-4 text-sm text-gray-600">You need to be signed in to view and save favorites.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  // Try to trigger the auth modal by dispatching a custom event.
                  // Your Navbar already has a state for opening the auth modal; if not, user can open Sign Up manually.
                  window.dispatchEvent(new CustomEvent("open-auth-modal"));
                }}
                className="px-4 py-2 rounded-full bg-black text-white"
              >
                Sign In / Sign Up
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-full border">Close</button>
            </div>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading favorites…</div>
            ) : error ? (
              <div className="py-4 text-center text-red-500">{error}</div>
            ) : favIds.length === 0 ? (
              <div className="py-6 text-center text-gray-600">
                No saved recipes yet.
                <div className="mt-3 text-sm">Click the heart on any recipe to save it here.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favIds.map((rid) => {
                  // defensive lookup: recipe key could be id, title, or name
                  const recipe = recipesData.find(r => {
                    const idCandidate = r.id || r.title || r.name || "";
                    return String(idCandidate) === String(rid);
                  });
                  // If recipe not found, still show a placeholder so UI doesn't crash.
                  if (!recipe) {
                    return (
                      <div key={rid} className="p-4 border rounded-lg">
                        <div className="text-sm font-semibold mb-2">Recipe not found</div>
                        <div className="text-xs text-gray-500">ID: {rid}</div>
                      </div>
                    );
                  }
                  return <RecipeCard key={rid} recipe={recipe} />;
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
