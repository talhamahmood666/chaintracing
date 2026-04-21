import { renderOG, ogSize, ogContentType } from '@/lib/og-template';
export const runtime = 'edge';
export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'ChainTracing — Trace stolen crypto across 4 chains';
export default async function Image() {
  return renderOG(
    'Trace Stolen Crypto Across 8 Blockchains',
    'Follow scammer wallets to exchange off-ramps. Free wallet scam check.'
  );
}
