import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthModal({ open, onClose }) {
  const { signup, login, current, logout } = useAuth();
  const [mode, setMode] = useState("signup"); // or "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  if (!open) return null;

  const handleSignup = () => {
    const r = signup({ email, password });
    if (!r.ok) setMsg(r.message);
    else { setMsg(null); onClose(); }
  };
  const handleLogin = () => {
    const r = login({ email, password });
    if (!r.ok) setMsg(r.message);
    else { setMsg(null); onClose(); }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{current ? "Account" : (mode === "signup" ? "Sign Up" : "Log In")}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        {current ? (
          <div>
            <p className="text-sm mb-4">Signed in as <strong>{current}</strong></p>
            <div className="flex gap-2">
              <button onClick={handleLogout} className="px-4 py-2 rounded-full border">Logout</button>
              <button onClick={onClose} className="px-4 py-2 rounded-full bg-black text-white">Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button onClick={()=>setMode("signup")} className={`px-3 py-1 rounded-full ${mode==="signup" ? "bg-black text-white" : "border"}`}>Sign Up</button>
              <button onClick={()=>setMode("login")} className={`px-3 py-1 rounded-full ${mode==="login" ? "bg-black text-white" : "border"}`}>Log In</button>
            </div>

            <label className="text-sm text-gray-700">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" type="email" />

            <label className="text-sm text-gray-700">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" type="password" />

            {msg && <div className="text-sm text-red-500 mb-2">{msg}</div>}

            <div className="flex gap-2">
              {mode === "signup" ? (
                <button onClick={handleSignup} className="px-4 py-2 rounded-full bg-black text-white">Create account</button>
              ) : (
                <button onClick={handleLogin} className="px-4 py-2 rounded-full bg-black text-white">Log in</button>
              )}
              <button onClick={onClose} className="px-4 py-2 rounded-full border">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
