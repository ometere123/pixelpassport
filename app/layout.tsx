import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { AppNav } from "@/components/layout/AppNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PixelPassport — One Passport. Many Worlds.",
  description:
    "A GenLayer-powered cross-game identity and item translation protocol. Your passport travels across RuneArena, ChainFarm, and VoidRun.",
  openGraph: {
    title: "PixelPassport",
    description: "One Passport. Many Worlds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
        <Providers>
          <AppNav />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
