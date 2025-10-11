import React from "react";

export default function Navbar(){
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">FoodCaster</div>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
          <a href="#home" className="hover:underline">Home</a>
          <a href="#recipes" className="hover:underline">Recipes</a>
          <a href="#contact" className="hover:underline">Contact</a>
          <button className="px-4 py-2 rounded-full border">Sign Up</button>
        </nav>

        <div className="sm:hidden">
          <button className="text-sm px-3 py-1 border rounded">Menu</button>
        </div>
      </div>
    </header>
  );
}
