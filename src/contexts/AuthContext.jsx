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

  // keep localStorage in sync
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (current) localStorage.setItem(EMAIL_KEY, current);
    else localStorage.removeItem(EMAIL_KEY);
  }, [token, current]);

  // When token exists, fetch /api/me to validate and set current
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      if (!token) {
        setCurrent(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/me`);
        if (!mounted) return;
        if (res.data?.ok) {
          setCurrent(res.data.email);
        } else {
          setToken(null);
          setCurrent(null);
        }
      } catch (err) {
        console.warn("Auth me failed", err?.response?.data || err.message);
        if (mounted) {
          setToken(null);
          setCurrent(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadMe();
    return () => { mounted = false; };
  }, [token]);

  const signup = async ({ email, password }) => {
    try {
      const res = await axios.post(`${API}/api/signup`, { email, password });
      if (res.data?.ok && res.data.token) {
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
    setToken(null);
    setCurrent(null);
    delete axios.defaults.headers.common.Authorization;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  };

  // Favorites helpers (you already had these)
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

  // --- Rating and Suggestions helpers (added) ---
  const rateRecipe = async (recipeId, rating) => {
    if (!token) return { ok: false, message: "Not authenticated" };
    try {
      const res = await axios.post(`${API}/api/rate`, { recipeId, rating });
      return res.data || { ok: true };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || err.message };
    }
  };

  const getSuggestions = async () => {
    try {
      const res = await axios.get(`${API}/api/suggestions`);
      return res.data?.suggestions || [];
    } catch (err) {
      console.error("getSuggestions", err);
      return [];
    }
  };

  const value = {
    current,
    token,
    signup,
    login,
    logout,
    getFavorites,
    toggleFavorite,
    isFavorited,
    rateRecipe,
    getSuggestions,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
