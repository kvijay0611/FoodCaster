import React from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

export default function App(){
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Home />
      </main>
      <footer className="text-center py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} FoodCaster — Keerti Vijay Ananth
      </footer>
    </div>
  );
}
