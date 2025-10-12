// src/components/AuthModal.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthModal({ open, onClose }) {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await signup({ email, password });
        if (!res.ok) setError(res.message || "Signup failed");
        else {
          onClose?.();
        }
      } else {
        const res = await login({ email, password });
        if (!res.ok) setError(res.message || "Login failed");
        else {
          onClose?.();
        }
      }
    } catch (err) {
      setError(err?.message || "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-600">Close</button>

        <h3 className="text-2xl font-semibold mb-4">{mode === "signup" ? "Sign Up" : "Log In"}</h3>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-2 rounded-full ${mode === "signup" ? "bg-black text-white" : "border"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-full ${mode === "login" ? "bg-black text-white" : "border"}`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          />

          <label className="block text-sm text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4"
          />

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-full bg-black text-white shadow"
            >
              {busy ? "Please wait…" : (mode === "signup" ? "Create account" : "Log in")}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-full border">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
