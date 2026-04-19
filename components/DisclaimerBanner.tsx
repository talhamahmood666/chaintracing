"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SESSION_KEY = "disclaimer_dismissed";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      background: "rgba(245,158,11,0.10)",
      borderTop: "1px solid rgba(245,158,11,0.35)",
      borderBottom: "1px solid rgba(245,158,11,0.35)",
    }}>
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-base flex-shrink-0" aria-hidden>⚠️</span>
          <p className="text-xs" style={{ color: "rgba(245,158,11,0.95)" }}>
            ChainTracing provides forensic evidence — we do not recover funds, contact exchanges, or represent you legally. Use our reports to support law enforcement filings.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss disclaimer"
          className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-70"
          style={{ color: "rgba(245,158,11,0.8)" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
