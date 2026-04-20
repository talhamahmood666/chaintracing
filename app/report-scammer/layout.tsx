import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report a Crypto Scam Wallet — Public Scammer Database',
  description: 'Report a scammer wallet address to warn other victims. Anonymous public submission. Adds to the ChainTracing scam wallet database for EVM, Solana, Tron, and Bitcoin.',
  alternates: { canonical: '/report-scammer' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
