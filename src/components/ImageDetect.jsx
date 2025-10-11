import React, { useState } from "react";

/**
 * ImageDetect - placeholder UI for ingredient detection.
 * To integrate real detection:
 *  - Replace mockDetectIngredients with Clarifai / Google Vision / TFJS inference.
 *  - For Clarifai: call Clarifai predict endpoint with image bytes and parse tags.
 *  - For TFJS: load model on client and run predict().
 */

export default function ImageDetect({ onDetect }) {
  const [preview, setPreview] = useState(null);
  const [detected, setDetected] = useState([]);

  const mockDetectIngredients = async () => {
    // simulate results
    return new Promise((res) => setTimeout(()=>res(["tomato","basil","garlic"]), 700));
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if(!f) return;
    setPreview(URL.createObjectURL(f));
    const tags = await mockDetectIngredients();
    setDetected(tags);
    if(onDetect) onDetect(tags);
  };

  return (
    <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-center">
      <div className="flex-1">
        <div className="text-sm text-gray-600 mb-1">Upload an image of ingredients / fridge</div>
        <input type="file" accept="image/*" onChange={handleFile} />
        <div className="mt-3 text-sm">
          Detected: {detected.length ? detected.join(", ") : <span className="text-muted">—</span>}
        </div>
      </div>

      <div className="w-48 h-32 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover"/> : <div className="text-sm text-muted">Preview</div>}
      </div>
    </div>
  );
}
// Example (Node): POST /detect
// Use Clarifai/GoogleVision server SDK and return tags to client
