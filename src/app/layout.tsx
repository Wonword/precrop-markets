import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Precrop Markets — Where Transparency Grows.",
  description:
    "Precrop Markets is the first platform where independent farmers create micro-futures contracts as NFTs, giving buyers direct access to future harvests while funding farmers at planting time.",
  keywords: [
    "micro-futures",
    "agricultural NFTs",
    "farm finance",
    "crop futures",
    "blockchain agriculture",
    "Base network",
    "USDC",
  ],
  openGraph: {
    title: "Precrop Markets — Where Transparency Grows.",
    description:
      "Connect farmers and buyers through transparent, blockchain-backed micro-futures contracts.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precrop Markets — Where Transparency Grows.",
    description:
      "Micro-futures NFTs connecting independent farmers with specialty buyers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-[var(--font-inter)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
