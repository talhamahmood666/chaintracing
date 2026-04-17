import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ChainTracing",
  description: "Terms governing use of ChainTracing blockchain forensics services.",
};

const LAST_UPDATED = "17 April 2026";

const sections = [
  {
    id: "service",
    title: "1. What ChainTracing Does",
    body: `ChainTracing is an informational blockchain forensics tool. We trace the on-chain movement of cryptocurrency across public ledgers and assign a risk score based on our scam database and heuristics. Reports are provided for informational purposes only.

ChainTracing is **not** a legal service, law enforcement agency, or fund recovery service. We do not guarantee the recovery of any funds, and we are not affiliated with any government authority or exchange. Nothing in our reports constitutes legal, financial, or investigative advice.`,
  },
  {
    id: "accuracy",
    title: "2. Accuracy & False Positives",
    body: `Our scam database is crowd-sourced and may contain inaccuracies, outdated entries, or false positives. Any address flagged as suspicious must be independently verified before any action is taken. We are not liable for decisions made based on our risk flags.

OFAC sanctions data is sourced from official public lists but we make no warranty that our copy is current. Always verify against the official OFAC SDN list at ofac.treasury.gov.`,
  },
  {
    id: "payments",
    title: "3. Payments & Refunds",
    body: `All payments are one-time, non-refundable except in the case of a verifiable technical error that prevented report delivery. If your report was not generated or contained a critical data error, contact support@chaintracing.app within **7 days** of payment with your order ID.

We do not offer refunds for unsatisfactory results, addresses with no on-chain activity, or change-of-mind. Payments are processed via Plisio; we do not store card or wallet credentials.`,
  },
  {
    id: "prohibited",
    title: "4. Prohibited Use",
    body: `You may not use ChainTracing to:

- Scrape, bulk-query, or automate requests beyond normal interactive use
- Harass, defame, or target individuals based on risk scores
- Submit false or fabricated scam reports
- Attempt to reverse-engineer or circumvent rate limits or access controls
- Use the service in any jurisdiction where doing so is unlawful

We reserve the right to suspend or terminate access for any violation without notice.`,
  },
  {
    id: "warranties",
    title: "5. No Warranties",
    body: `ChainTracing is provided "as is" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that results will be accurate or complete. Use the service at your own risk.`,
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    body: `To the maximum extent permitted by law, ChainTracing and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of funds, loss of data, or reputational harm, arising out of or in connection with your use of the service.

Our total liability for any direct claim shall not exceed the amount you paid for the specific report giving rise to the claim.`,
  },
  {
    id: "jurisdiction",
    title: "7. Governing Law",
    body: `These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Pakistan. If any provision of these Terms is found unenforceable, the remaining provisions continue in full force.`,
  },
  {
    id: "termination",
    title: "8. Termination",
    body: `We may suspend or terminate your access to ChainTracing at any time, with or without cause or notice. Provisions that by their nature should survive termination (including Sections 5, 6, and 7) shall do so.`,
  },
  {
    id: "changes",
    title: "9. Changes to These Terms",
    body: `We may update these Terms at any time. Continued use of the service after changes are posted constitutes acceptance of the revised Terms. Material changes will be noted by updating the "Last Updated" date below.`,
  },
  {
    id: "contact",
    title: "10. Contact",
    body: `For support, refund requests, or legal enquiries:\n\n**Email:** support@chaintracing.app`,
  },
];

function renderBody(text: string) {
  return text.split("\n\n").map((para, i) => {
    if (para.startsWith("- ")) {
      const items = para.split("\n").filter(l => l.startsWith("- "));
      return (
        <ul key={i} className="list-disc list-inside space-y-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
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

export default function TermsPage() {
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
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
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
