// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import FavoritesModal from "./FavoritesModal";

export default function Navbar() {
  const { current } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  useEffect(() => {
    // Allow other components to open auth modal by dispatching `open-auth-modal`
    const handler = () => setAuthOpen(true);
    window.addEventListener("open-auth-modal", handler);
    return () => window.removeEventListener("open-auth-modal", handler);
  }, []);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-display font-bold">FoodCaster</div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
              <button onClick={() => handleScrollTo("home")} className="hover:underline">Home</button>
              <button onClick={() => handleScrollTo("recipes")} className="hover:underline">Recipes</button>
              <button onClick={() => handleScrollTo("contact")} className="hover:underline">Contact</button>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setFavOpen(true)}
              className="px-3 py-1 rounded-full border text-sm"
              aria-label="Open favorites"
            >
              Favorites
            </button>

            <button
              onClick={() => setAuthOpen(true)}
              className="px-4 py-2 rounded-full border text-sm"
            >
              {current ? current : "Sign Up"}
            </button>
          </div>

          {/* Mobile: simple menu button */}
          <div className="md:hidden">
            <button className="px-3 py-1 rounded border" onClick={() => alert("Open mobile menu (implement if needed)")}>Menu</button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <FavoritesModal open={favOpen} onClose={() => setFavOpen(false)} />
    </>
  );
}
