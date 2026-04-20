import { renderOG, ogSize, ogContentType } from '@/lib/og-template';
export const runtime = 'edge';
export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'Report a Crypto Scam Wallet';
export default async function Image() {
  return renderOG(
    'Report a Crypto Scam Wallet',
    'Anonymous public submission. Help warn other victims.'
  );
}
