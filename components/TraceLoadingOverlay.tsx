'use client';
import Logo from "./Logo";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Connecting to blockchain nodes",
  "Tracing wallet hop-by-hop",
  "Checking centralized exchange clusters",
  "Cross-referencing scam database",
  "Analyzing bridge activity",
  "Calculating risk score",
  "Generating forensic report",
];

export default function TraceLoadingOverlay() {
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'rgba(10, 22, 40, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tracing wallet"
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="w-full max-w-xs">
          <Logo variant="mark" className="w-full h-auto" />
        </div>
        <div className="text-center">
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: '#00D9FF' }}
          >
            {MESSAGES[messageIdx]}...
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            This usually takes 20 to 60 seconds. Please don't close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}
