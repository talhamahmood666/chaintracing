"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const CATEGORIES = ["Shipped", "In Progress", "Planned", "Longer-Term", "Exploring", "General"];

export default function CommentForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("loading");

    // Pre-fill name from session if available
    let resolvedName = name.trim();
    if (!resolvedName) {
      try {
        const { data } = await createClient().auth.getUser();
        resolvedName = data.user?.user_metadata?.full_name || data.user?.email || "";
      } catch {}
    }

    const res = await fetch("/api/roadmap-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), author_name: resolvedName || null, category: category || null }),
    });

    if (res.ok) {
      setStatus("success");
      setMessage("Thanks! Your comment is pending review.");
      setContent("");
      setName("");
      setCategory("");
    } else {
      const d = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(d.error ?? "Something went wrong. Please try again.");
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "var(--text-primary)",
    outline: "none",
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            Category (optional)
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
          Comment or feature request
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What do you think? What would you like to see built?"
          maxLength={1000}
          rows={4}
          required
          className="w-full rounded-xl px-4 py-2.5 text-sm resize-none"
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{content.length}/1000</p>
      </div>
      <button
        type="submit"
        disabled={status === "loading" || !content.trim()}
        className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #00D9FF, #0099BB)",
          color: "#0A1628",
          opacity: status === "loading" || !content.trim() ? 0.6 : 1,
          cursor: status === "loading" || !content.trim() ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Submitting..." : "Submit Comment"}
      </button>
      {status === "success" && (
        <p className="text-sm font-semibold" style={{ color: "#00E676" }}>{message}</p>
      )}
      {status === "error" && (
        <p className="text-sm font-semibold" style={{ color: "#FF4757" }}>{message}</p>
      )}
    </form>
  );
}
