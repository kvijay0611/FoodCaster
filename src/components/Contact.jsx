// src/components/Contact.jsx
import React, { useState } from "react";
import { send } from "@emailjs/browser";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", title: "", message: "" });
  const [status, setStatus] = useState(null);

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.title || !form.message) {
      setStatus({ ok: false, text: "Please fill in all fields." });
      return;
    }

    setStatus({ ok: null, text: "Sending..." });

    try {
      await send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          name: form.name,
          email: form.email,
          title: form.title,
          message: form.message,
          time: new Date().toLocaleString(),
        },
        PUBLIC_KEY
      );

      setStatus({ ok: true, text: "✅ Message sent successfully!" });
      setForm({ name: "", email: "", title: "", message: "" });
    } catch (err) {
      console.error("EmailJS Error:", err);
      setStatus({ ok: false, text: "❌ Failed to send message. Please try again later." });
    }
  };

  return (
    <section id="contact" className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Get in Touch</h2>
      <p className="text-gray-600 mb-8">
        Have a question, suggestion, or collaboration idea? Send us a message below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-2xl p-6 max-w-2xl mx-auto shadow-sm space-y-5"
      >
        <div>
          <label className="block text-sm text-gray-700 mb-2">Your Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:ring-1 focus:ring-black outline-none"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">Your Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:ring-1 focus:ring-black outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">Subject / Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:ring-1 focus:ring-black outline-none"
            placeholder="Subject of your message"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 h-32 resize-none focus:ring-1 focus:ring-black outline-none"
            placeholder="Type your message here..."
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-black text-white hover:opacity-90 transition"
        >
          Send Message
        </button>

        {status && (
          <p
            className={`text-sm mt-3 ${
              status.ok ? "text-green-600" : status.ok === false ? "text-red-500" : "text-gray-600"
            }`}
          >
            {status.text}
          </p>
        )}
      </form>
    </section>
  );
}
