// src/components/Contact.jsx
import React, { useState } from "react";
import { init, send } from "@emailjs/browser";
import axios from "axios";

const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

if (PUBLIC_KEY) {
  try {
    init(PUBLIC_KEY);
  } catch (err) {
    // ignore init errors
    console.warn("EmailJS init failed:", err);
  }
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // success | error | sending

  const sendViaEmailJS = async () => {
    setStatus("sending");
    try {
      await send(SERVICE, TEMPLATE, {
        from_name: name,
        from_email: email,
        message,
      });
      setStatus("success");
      setName(""); setEmail(""); setMessage("");
      return true;
    } catch (err) {
      console.error("EmailJS send error:", err);
      setStatus("error");
      return false;
    }
  };

  const sendViaBackend = async () => {
    setStatus("sending");
    try {
      const res = await axios.post(`${API_BASE}/api/contact`, {
        name, email, message
      });
      if (res.data?.ok) {
        setStatus("success");
        setName(""); setEmail(""); setMessage("");
        return true;
      } else {
        setStatus("error");
        return false;
      }
    } catch (err) {
      console.error("Backend contact error:", err);
      setStatus("error");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (!email || !message || !name) {
      setStatus("error");
      return;
    }

    // prefer EmailJS if configured
    if (SERVICE && TEMPLATE && PUBLIC_KEY) {
      const ok = await sendViaEmailJS();
      if (ok) return;
      // fallback to backend
      await sendViaBackend();
    } else {
      // no EmailJS keys -> try backend
      await sendViaBackend();
    }
  };

  return (
    <section id="contact" className="max-w-6xl mx-auto px-6 py-12">
      <div className="bg-white border rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-4">Contact</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Message</label>
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full border rounded px-3 py-2 h-32" />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="px-4 py-2 rounded-full bg-black text-white">
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && <div className="text-sm text-green-600">Message sent — thank you!</div>}
            {status === "error" && <div className="text-sm text-red-600">Failed to send. Check console or try again.</div>}
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          Tip: for EmailJS, set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY in your environment.
        </div>
      </div>
    </section>
  );
}
