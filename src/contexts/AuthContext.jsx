// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "fc_token";
const EMAIL_KEY = "fc_email";

const AuthContext = createContext();
export function useAuth(){ return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [current, setCurrent] = useState(() => localStorage.getItem(EMAIL_KEY) || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  const signup = async ({ email, password }) => {
    try {
      const res = await axios.post(`${API}/api/signup`, { email, password });
      if (res.data?.ok && res.data.token) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(EMAIL_KEY, res.data.email);
        setToken(res.data.token);
        setCurrent(res.data.email);
        return { ok: true };
      }
      return { ok: false, message: res.data?.message || "Signup failed" };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || err.message };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await axios.post(`${API}/api/login`, { email, password });
      if (res.data?.ok && res.data.token) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(EMAIL_KEY, res.data.email);
        setToken(res.data.token);
        setCurrent(res.data.email);
        return { ok: true };
      }
      return { ok: false, message: res.data?.message || "Login failed" };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setCurrent(null);
    delete axios.defaults.headers.common.Authorization;
  };

  const getFavorites = async () => {
    if (!token) return [];
    try {
      const res = await axios.get(`${API}/api/favorites`);
      return (res.data?.favorites || []);
    } catch (err) {
      console.error("getFavorites", err);
      return [];
    }
  };

  const toggleFavorite = async (recipeId) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    try {
      const res = await axios.post(`${API}/api/favorites/toggle`, { recipeId });
      return { ok: true, favorites: (res.data?.favorites || []) };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || err.message };
    }
  };

  const isFavorited = async (recipeId) => {
    if (!token) return false;
    const favs = await getFavorites();
    return favs.includes(recipeId);
  };

  const value = {
    current,
    signup,
    login,
    logout,
    getFavorites,
    toggleFavorite,
    isFavorited,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
