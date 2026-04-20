import { renderOG, ogSize, ogContentType } from '@/lib/og-template';
export const runtime = 'edge';
export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'About ChainTracing';
export default async function Image() {
  return renderOG(
    'Blockchain Forensics for Victims & Investigators',
    'Affordable, evidence-grade on-chain tracing.'
  );
}
