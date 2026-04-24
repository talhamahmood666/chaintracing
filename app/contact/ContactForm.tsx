"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    // Pre-fill email from session if blank
    let resolvedEmail = email.trim();
    if (!resolvedEmail) {
      try {
        const { data } = await createClient().auth.getUser();
        resolvedEmail = data.user?.email ?? "";
      } catch {}
    }

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: resolvedEmail, subject: subject.trim(), message: message.trim() }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const d = await res.json().catch(() => ({}));
      setStatus("error");
      setErrorMsg(d.error ?? "Something went wrong. Please try again.");
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "var(--text-primary)",
    outline: "none",
  } as React.CSSProperties;

  if (status === "success") {
    return (
      <div className="rounded-xl px-5 py-8 text-center"
        style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.25)" }}>
        <p className="text-2xl mb-2">&#10003;</p>
        <p className="text-sm font-semibold" style={{ color: "#00E676" }}>
          Thanks, we will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            Name <span style={{ color: "#FF4757" }}>*</span>
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" maxLength={100} required
            className="w-full rounded-xl px-4 py-2.5 text-sm" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            Email <span style={{ color: "#FF4757" }}>*</span>
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" maxLength={200} required
            className="w-full rounded-xl px-4 py-2.5 text-sm" style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
          Subject (optional)
        </label>
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="What is this about?" maxLength={200}
          className="w-full rounded-xl px-4 py-2.5 text-sm" style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
          Message <span style={{ color: "#FF4757" }}>*</span>
        </label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Tell us what you need..." maxLength={5000} rows={5} required
          className="w-full rounded-xl px-4 py-2.5 text-sm resize-none" style={inputStyle} />
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{message.length}/5000</p>
      </div>
      {status === "error" && (
        <p className="text-sm font-semibold" style={{ color: "#FF4757" }}>{errorMsg}</p>
      )}
      <button type="submit" disabled={status === "loading"}
        className="px-8 py-3 rounded-xl text-sm font-black transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #00D9FF, #0099BB)",
          color: "#0A1628",
          opacity: status === "loading" ? 0.6 : 1,
          cursor: status === "loading" ? "wait" : "pointer",
        }}>
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
