"use client";

import { useState } from "react";
import { X } from "lucide-react";

const FULL_TEXT = `ChainTracing aggregates public blockchain data and community scam databases (OFAC SDN, MEW darklist) to produce forensic reports. We are not a recovery service, licensed investigator, legal representative, or law enforcement agency. We do not contact exchanges, file reports, or negotiate with scammers on your behalf. Reports are informational evidence intended to support filings with law enforcement (FBI IC3, Action Fraud UK, local police) and exchange compliance teams. Exchanges only freeze funds when served with proper legal process. Scam database matches are reported from public sources and do not constitute accusations. Verify all findings independently before acting.`;

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hover:text-white transition-colors"
      >
        Disclaimer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative"
            style={{
              background: "rgba(10,22,40,0.97)",
              border: "1px solid rgba(0,217,255,0.2)",
              boxShadow: "0 0 60px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={16} />
            </button>
            <h2 className="text-base font-bold mb-4" style={{ color: "#00D9FF" }}>Disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{FULL_TEXT}</p>
          </div>
        </div>
      )}
    </>
  );
}
