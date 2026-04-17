import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChainTracing — Trace Stolen Crypto",
  description: "Follow stolen cryptocurrency hop-by-hop to exchanges. Free risk score, full evidence report for scam victims.",
  openGraph: {
    title: "ChainTracing — Trace Stolen Crypto",
    description: "Follow stolen cryptocurrency hop-by-hop to exchanges.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ background: '#0A1628', colorScheme: 'dark' }}>
      <body className="lab-grid min-h-full flex flex-col" style={{ color: 'var(--text-primary)' }}>
        <Header />
        <main className="flex-1 relative z-10">{children}</main>
      </body>
    </html>
  );
}
