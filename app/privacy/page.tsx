import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ChainTracing",
  description: "How ChainTracing collects, uses, and protects your data.",
  robots: { index: false, follow: true },
};

const LAST_UPDATED = "17 April 2026";

const sections = [
  {
    id: "collected",
    title: "1. Data We Collect",
    body: `**Account data:** Email address when you sign up. We use Supabase Auth — passwords are hashed and never stored in plaintext.

**Scanned addresses:** Every wallet address you submit is stored to generate your report and to improve our scam database. Addresses are public blockchain data by nature.

**IP address:** Collected on each request for rate-limiting purposes only. Retained for **30 days** then purged.

**Payment data:** Payments are processed by Plisio. We store the invoice ID, amount, and payment status. We never see or store card numbers, bank details, or crypto private keys.

**Usage metadata:** Report tier, timestamps, chain selected. No tracking pixels or behavioural profiling.`,
  },
  {
    id: "use",
    title: "2. How We Use Your Data",
    body: `- Deliver your trace report and PDF
- Rate-limit abuse and prevent scraping
- Send transactional emails (report ready, payment confirmed)
- Improve our scam database (addresses only, never personal data)

We do not sell, rent, or share your personal data with third parties for marketing.`,
  },
  {
    id: "third-parties",
    title: "3. Third-Party Services",
    body: `**Supabase** — database and authentication (EU/US servers). Data processed under Supabase's DPA.

**Plisio** — cryptocurrency payment processing. Subject to Plisio's privacy policy.

**Upstash** — Redis rate-limit counters keyed by hashed IP. No personal data stored beyond the hash.

**Blockchain APIs** — Etherscan, Solscan, TronGrid, Blockchair. Your queried address is sent to these APIs. These are public blockchain explorers; addresses are already public data.

No advertising networks or analytics SDKs are embedded in this application.`,
  },
  {
    id: "cookies",
    title: "4. Cookies & Storage",
    body: `We use a single session cookie set by Supabase Auth when you log in. This cookie is HTTP-only, Secure, and SameSite=Lax. It expires when you sign out or after 7 days of inactivity.

No tracking cookies. No third-party ad cookies. No local storage beyond your session token.`,
  },
  {
    id: "rights",
    title: "5. Your Rights",
    body: `You may request any of the following at any time by emailing support@chaintracing.org:

- **Access** — a copy of all personal data we hold on you
- **Deletion** — erasure of your account and associated personal data (GDPR Article 17)
- **Export** — your report data in JSON format
- **Correction** — update an incorrect email address

We will respond within 30 days. Note: deleting your account does not remove scanned wallet addresses from our scam database where they were submitted as scam evidence.`,
  },
  {
    id: "retention",
    title: "6. Data Retention",
    body: `**IP addresses:** 30 days.

**Reports:** Retained indefinitely to fulfil your purchased report. You may request deletion after 12 months.

**Account data:** Retained until you delete your account.

**Payment records:** Retained for 7 years to meet financial record-keeping obligations.`,
  },
  {
    id: "security",
    title: "7. Security",
    body: `All data is transmitted over TLS 1.2+. Database access uses Supabase Row Level Security policies. Admin access is restricted to a separate admins table. We conduct periodic reviews of access controls.

No system is perfectly secure. In the event of a breach affecting your personal data, we will notify you within 72 hours as required by applicable law.`,
  },
  {
    id: "children",
    title: "8. Children",
    body: `ChainTracing is not directed at children under 13. We do not knowingly collect data from anyone under 13. If you believe we have done so, contact us and we will delete it promptly.`,
  },
  {
    id: "changes",
    title: "9. Changes to This Policy",
    body: `We may update this policy. Material changes will be noted by the "Last Updated" date. Continued use after changes are posted constitutes acceptance.`,
  },
  {
    id: "contact",
    title: "10. Contact & GDPR Enquiries",
    body: `**Email:** support@chaintracing.org\n\nFor GDPR-specific requests, please include "GDPR Request" in your subject line. We will respond within 30 days.`,
  },
];

function renderBody(text: string) {
  return text.split("\n\n").map((para, i) => {
    if (para.startsWith("- ")) {
      const items = para.split("\n").filter(l => l.startsWith("- "));
      return (
        <ul key={i} className="list-disc list-inside space-y-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          {items.map((item, j) => {
            const parts = item.slice(2).split(/(\*\*.+?\*\*)/g);
            return (
              <li key={j}>
                {parts.map((p, k) =>
                  p.startsWith("**") ? <strong key={k} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong> : p
                )}
              </li>
            );
          })}
        </ul>
      );
    }
    const html = para
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/\n/g, '<br/>');
    return (
      <p key={i} className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}
        dangerouslySetInnerHTML={{ __html: html }} />
    );
  });
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium" style={{ color: '#00D9FF' }}>← Home</Link>
      </div>

      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded"
            style={{ background: 'rgba(0,217,255,0.1)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.2)' }}>
            Legal
          </span>
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last updated: {LAST_UPDATED}</p>
      </div>

      {/* Anchor nav */}
      <div className="glass rounded-xl p-4 mb-8 flex flex-wrap gap-x-4 gap-y-2">
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} className="text-xs font-medium hover:text-white transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            {s.title.split(". ")[1]}
          </a>
        ))}
      </div>

      <div className="space-y-8">
        {sections.map(s => (
          <section key={s.id} id={s.id} className="glass rounded-xl p-6">
            <h2 className="text-base font-black mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-geist-mono)' }}>
              {s.title}
            </h2>
            {renderBody(s.body)}
          </section>
        ))}
      </div>
    </div>
  );
}
