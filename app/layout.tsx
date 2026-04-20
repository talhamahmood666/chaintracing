import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://chaintracing-app.vercel.app'),
  title: {
    default: 'ChainTracing — Trace Stolen Crypto Across EVM, Solana, Tron & Bitcoin',
    template: '%s | ChainTracing',
  },
  description: 'Trace stolen cryptocurrency across Ethereum, Solana, Tron, and Bitcoin. Follow scammer wallets to exchange off-ramps and generate evidence-grade reports for law enforcement.',
  keywords: ['trace stolen crypto', 'blockchain forensics', 'crypto scam wallet check', 'recover stolen bitcoin', 'wallet tracer', 'CEX off-ramp detection'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'ChainTracing',
    title: 'ChainTracing — Trace Stolen Crypto Across 4 Chains',
    description: 'Trace stolen cryptocurrency across Ethereum, Solana, Tron, and Bitcoin. Follow funds to exchange off-ramps.',
    url: 'https://chaintracing-app.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChainTracing — Trace Stolen Crypto',
    description: 'Trace stolen crypto across EVM, Solana, Tron, Bitcoin. Follow to CEX off-ramps.',
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ background: '#0A1628', colorScheme: 'dark' }}>
      <body className="lab-grid min-h-full flex flex-col" style={{ color: 'var(--text-primary)' }}>
        <DisclaimerBanner />
        <Header />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
