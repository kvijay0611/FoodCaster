import React from "react";

export default function Hero({ onGenerate }) {
  return (
    <section
      id="home"
      className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8"
    >
      <div className="flex-1">
        <h1 className="hero-title text-5xl md:text-6xl leading-tight font-bold mb-6">
          Welcome to the 
          <br />
          Recipe Genie!
        </h1>

        <p className="text-muted max-w-xl mb-8">
          Discover a world of delicious recipes tailored to your preferences filter by diet,
          time, and difficulty or upload an image to detect ingredients!
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => onGenerate && onGenerate()}
            className="px-6 py-3 rounded-full bg-black text-white shadow-sm hover:opacity-95"
          >
            Generate Recipes
          </button>

          <a href="#recipes" className="px-6 py-3 rounded-full border">
            Explore
          </a>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <img
          src="https://www.cubesnjuliennes.com/wp-content/uploads/2020/07/Chicken-Biryani-Recipe.jpg"
          alt="hero"
          className="w-96 h-80 object-cover rounded-3xl shadow-lg"
        />
      </div>
    </section>
  );
}
