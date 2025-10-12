// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import FavoritesModal from "./FavoritesModal";

/**
 * Responsive Navbar with accessible mobile drawer
 */
export default function Navbar() {
  const { current, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    // if drawer opens, focus close button
    if (drawerOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
      // disable body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    // ESC to close drawer
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // smooth scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setDrawerOpen(false); // close drawer on navigation (mobile)
    }
  };

  return (
    <>
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-display font-bold">FoodCaster</div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
              <button onClick={() => scrollTo("home")} className="hover:underline">Home</button>
              <button onClick={() => scrollTo("recipes")} className="hover:underline">Recipes</button>
              <button onClick={() => scrollTo("contact")} className="hover:underline">Contact</button>
            </nav>
          </div>

          {/* Desktop right side */}
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

          {/* Mobile controls */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-lg border"
            >
              {/* simple hamburger icon */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="#111827" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        aria-hidden={!drawerOpen}
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-200 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
      >
        {/* backdrop */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />

        {/* panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className={`absolute top-0 left-0 right-0 mx-auto mt-6 max-w-lg transform transition-transform duration-300 ${
            drawerOpen ? "translate-y-0" : "-translate-y-6"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-md border p-5 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-xl font-bold">FoodCaster</div>
              <button
                ref={closeBtnRef}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg border"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-3">
              <button onClick={() => scrollTo("home")} className="text-left py-2 px-3 rounded-lg hover:bg-gray-50">Home</button>
              <button onClick={() => scrollTo("recipes")} className="text-left py-2 px-3 rounded-lg hover:bg-gray-50">Recipes</button>
              <button onClick={() => scrollTo("contact")} className="text-left py-2 px-3 rounded-lg hover:bg-gray-50">Contact</button>
            </nav>

            <div className="mt-5 border-t pt-4 flex flex-col gap-3">
              <button
                onClick={() => { setFavOpen(true); setDrawerOpen(false); }}
                className="w-full text-left py-2 px-3 rounded-lg border hover:bg-gray-50"
              >
                Favorites
              </button>

              {current ? (
                <>
                  <div className="text-sm text-gray-700">{current}</div>
                  <button
                    onClick={() => { logout(); setDrawerOpen(false); }}
                    className="w-full py-2 px-3 rounded-full border text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setAuthOpen(true); setDrawerOpen(false); }}
                  className="w-full py-2 px-3 rounded-full border text-sm"
                >
                  Sign Up / Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <FavoritesModal open={favOpen} onClose={() => setFavOpen(false)} />
    </>
  );
}
