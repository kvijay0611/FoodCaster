import React, { useState, useRef, useEffect } from "react";

/**
 * ImageDetect component
 *
 * Props:
 * - onDetect?: (ingredients: string[]) => void
 *
 * This component:
 * - Shows a styled "Choose Image" button (native input is hidden).
 * - Displays a small preview thumbnail after selecting an image.
 * - Performs a tiny, safe "mock detection" by using the filename (demo only).
 * - Lets user type comma-separated ingredients manually.
 * - Calls `onDetect` whenever the detected ingredients change.
 */
export default function ImageDetect({ onDetect } = {}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState([]); // array of strings
  const [manualInput, setManualInput] = useState("");
  const fileRef = useRef(null);

  // call onDetect when detectedIngredients changes
  useEffect(() => {
    if (typeof onDetect === "function") {
      onDetect(detectedIngredients);
    }
  }, [detectedIngredients, onDetect]);

  // Basic mock detection: extract words from filename (without extension)
  // In real app you'd call an image recognition API here.
  function mockDetectFromFile(file) {
    if (!file || !file.name) return [];
    const name = file.name.split(".").slice(0, -1).join(".") || file.name;
    // split on non-alpha characters, keep words of length >= 2
    const words = name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);
    // Return unique short list
    return Array.from(new Set(words)).slice(0, 6);
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // do mock-detection (demo)
    const detected = mockDetectFromFile(file);
    setDetectedIngredients(detected);

    // clear manual input when an image is used (so UI is consistent)
    setManualInput("");

    // revoke object URL when component unmounts or a new file is selected
    // (handled in effect below)
  };

  // cleanup preview object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleManualChange = (e) => {
    const value = e.target.value;
    setManualInput(value);

    const list = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    // if user types manually, prefer that over image detection
    setDetectedIngredients(list);
  };

  const clearSelection = () => {
    setPreviewUrl(null);
    setDetectedIngredients([]);
    setManualInput("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left: upload */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Upload an image to detect ingredients</label>

          <div className="flex items-center gap-4">
            <label
              htmlFor="image-upload"
              className="relative inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium cursor-pointer hover:opacity-95 transition"
            >
              <input
                id="image-upload"
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span>Choose Image</span>
            </label>

            {previewUrl ? (
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm rounded-full border text-gray-700 hover:bg-gray-50"
                aria-label="Clear selection"
              >
                Remove
              </button>
            ) : null}
          </div>

          <p className="text-sm text-gray-500">
            Tip: take a clear photo of your ingredients on a plain background for best detection results.
          </p>

          {previewUrl && (
            <div className="mt-3 w-40 h-28 rounded-lg overflow-hidden border">
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Right: manual input */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Or type ingredients (comma separated)</label>
          <input
            type="text"
            placeholder="e.g., tomato, egg, basil"
            value={manualInput}
            onChange={handleManualChange}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 focus:ring-2 focus:ring-black/80 outline-none"
          />

          <div className="pt-2">
            <div className="text-sm text-gray-500 mb-2">Detected:</div>
            {detectedIngredients.length ? (
              <div className="flex flex-wrap gap-2">
                {detectedIngredients.map((ing, idx) => (
                  <span
                    key={ing + idx}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm bg-white"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
