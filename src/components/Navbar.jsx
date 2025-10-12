// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import FavoritesModal from "./FavoritesModal";

export default function Navbar() {
  const { current, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  useEffect(() => {
    // Listen to global event used by other components to open auth modal
    const handler = () => setAuthOpen(true);
    window.addEventListener("open-auth-modal", handler);
    return () => window.removeEventListener("open-auth-modal", handler);
  }, []);

  const scrollTo = (id) => {
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
              <button onClick={() => scrollTo("home")} className="hover:underline">Home</button>
              <button onClick={() => scrollTo("recipes")} className="hover:underline">Recipes</button>
              <button onClick={() => scrollTo("contact")} className="hover:underline">Contact</button>
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

            {current ? (
              <>
                <span className="text-sm text-gray-700">{current}</span>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 rounded-full border text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 rounded-full border text-sm"
              >
                Sign Up
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button className="px-3 py-1 rounded border" onClick={() => alert("Mobile menu: implement if needed")}>Menu</button>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <FavoritesModal open={favOpen} onClose={() => setFavOpen(false)} />
    </>
  );
}
