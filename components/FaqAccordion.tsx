'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: "How do I trace stolen cryptocurrency?", a: "Paste the scammer's wallet address above. ChainTracing runs a BFS search across EVM chains, Solana, Tron, and Bitcoin, flagging mixers, bridges, and exchange deposits so you can see exactly where your funds went." },
  { q: "Can stolen crypto be recovered?", a: "ChainTracing produces the on-chain evidence. Actual recovery requires law enforcement, a lawyer, or the receiving exchange's abuse team — our PDF is built for all three." },
  { q: "How do I know if a wallet address is a scammer?", a: "Enter the address for a free risk score. We cross-check against 4,700+ known scam addresses, OFAC sanctions, phishing databases, and behavioural patterns." },
  { q: "Which blockchains can you trace?", a: "Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin — all in one trace." },
  { q: "How far can you follow the funds?", a: "Up to 20 hops on Deep Trace. We also flag when funds have passed through a CEX — beyond that point on-chain tracing becomes unreliable and the exchange must be subpoenaed." },
  { q: "What do I do if I sent crypto to a scammer?", a: "Act fast — funds move through mixers within hours. Run a free trace to capture the hop path, then file reports with the receiving exchange, local police, and IC3 (FBI)." },
  { q: "Do you work with law enforcement?", a: "Yes — our PDF reports are built to evidentiary standards with block explorer citations, timestamps, and compliance letters." },
  { q: "Is my data private?", a: "Reports are accessible only via your unique token. We never share your data or the addresses you trace." },
];

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className="glass rounded-2xl p-6 animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
          <button
            className="flex items-center justify-between cursor-pointer w-full text-left"
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            aria-expanded={openIdx === idx}
          >
            <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
            <ChevronDown
              className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
              style={{ color: '#00D9FF', transform: openIdx === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {openIdx === idx && (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
