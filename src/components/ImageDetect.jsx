import React, { useState } from "react";

/**
 * ImageDetect - styled minimalist UI for ingredient detection + manual input.
 *
 * Props:
 *   onDetect(tags: string[]) - optional callback receiving detected tags (string[], lowercase)
 */
export default function ImageDetect({ onDetect }) {
  const [preview, setPreview] = useState(null);
  const [detected, setDetected] = useState([]);     // tags coming from mock API or upload
  const [manual, setManual] = useState([]);         // tags added by user typing
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  // mock detection - replace with real API integration later
  const mockDetectIngredients = async () => {
    return new Promise((res) =>
      setTimeout(() => res(["tomato", "basil", "garlic"]), 700)
    );
  };

  // merge and normalize tags and call callback
  const pushTags = (tags) => {
    const normalized = Array.from(
      new Set(
        ([
          ...detected.map(t => String(t).toLowerCase()),
          ...manual.map(t => String(t).toLowerCase()),
          ...(Array.isArray(tags) ? tags : []).map(t => String(t).toLowerCase())
        ]).filter(Boolean)
      )
    );
    // update local lists: keep detected separate, manual separate (but normalized merged to detected for callback)
    // For simplicity, we'll put everything into detected for display; keep manual state too.
    setDetected(prev => {
      // keep any server-detected tags plus new ones not in manual
      const combined = Array.from(new Set([...prev.map(x=>x.toLowerCase()), ...normalized]));
      return combined;
    });
    // also update manual so chips from typed items are removable independently
    setManual(prev => {
      const prevNorm = prev.map(p => p.toLowerCase());
      const newManual = normalized.filter(t => !prevNorm.includes(t) && !prev.includes(t)).slice(0); // keep manual unique
      return Array.from(new Set([...prev.map(p=>p.toLowerCase()), ...newManual]));
    });

    // call parent
    if (onDetect) onDetect(normalized);
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setBusy(true);

    try {
      const tags = await mockDetectIngredients(f); // replace with real API call
      // push detected tags
      pushTags(tags || []);
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      setBusy(false);
    }
  };

  // Add manual tags from input; allow comma-separated or single word
  const handleAddManual = () => {
    if (!input) return;
    // split on commas, trim, remove empties
    const parts = input.split(",").map(p => p.trim()).filter(Boolean);
    if (!parts.length) {
      setInput("");
      return;
    }
    pushTags(parts);
    setInput("");
  };

  // Enter key handler for input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddManual();
    }
  };

  // Remove a tag (from both detected and manual arrays)
  const removeTag = (tag) => {
    const t = String(tag).toLowerCase();
    setDetected(prev => prev.filter(x => x.toLowerCase() !== t));
    setManual(prev => prev.filter(x => x.toLowerCase() !== t));
    const merged = Array.from(new Set([...detected.map(d=>d.toLowerCase()), ...manual.map(m=>m.toLowerCase())].filter(x=>x !== t)));
    if (onDetect) onDetect(merged);
  };

  // Clear all tags
  const clearAll = () => {
    setDetected([]);
    setManual([]);
    if (onDetect) onDetect([]);
  };

  // Render combined chips: show manual tags first, then detected (deduplicated)
  const combinedTags = Array.from(new Set([
    ...manual.map(x => x.toLowerCase()),
    ...detected.map(x => x.toLowerCase())
  ]));

  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row gap-6 items-center">
      {/* Left: controls */}
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload an image of ingredients / fridge
        </label>

        <div className="flex items-center gap-3">
          <input
            id="ingredient-upload"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="sr-only"
          />
          <label
            htmlFor="ingredient-upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border hover:bg-gray-50 cursor-pointer text-sm"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m4-4v4" />
            </svg>
            <span className="text-sm">Choose Image</span>
          </label>

          <div className="text-sm text-gray-500">
            {busy ? <span>Detecting…</span> : (preview ? <span>File ready</span> : <span>No file chosen</span>)}
          </div>
        </div>

        {/* Manual ingredient input */}
        <div className="mt-4">
          <label className="block text-sm text-gray-700 mb-2">Type ingredients (comma-separated) or add one-by-one</label>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "tomato, onion" or "garlic"'
              className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Type ingredient names"
            />
            <button
              onClick={handleAddManual}
              className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Detected / Manual chips + clear */}
        <div className="mt-4 text-sm text-gray-600">
          <div className="mb-1 flex items-center justify-between">
            <div>Detected:</div>
            {combinedTags.length > 0 && (
              <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">Clear all</button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {combinedTags.length ? (
              combinedTags.map((t) => (
                <span key={t} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700 border">
                  <span className="capitalize">{t}</span>
                  <button
                    onClick={() => removeTag(t)}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400">
            Tip: take a clear photo of your ingredients on a plain background for best detection results.
          </p>
        </div>
      </div>

      {/* Right: preview */}
      <div className="w-48 h-36 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-contain" />
        ) : (
          <div className="text-sm text-gray-400">Preview</div>
        )}
      </div>
    </div>
  );
}
