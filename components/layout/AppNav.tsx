"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/games", label: "Games" },
  { href: "/inventory", label: "Inventory" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/activity", label: "Activity" },
  { href: "/account", label: "Account" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "rgba(9,10,18,0.95)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold" style={{ fontFamily: "monospace" }}>
            <span style={{ color: "var(--passport-gold)" }}>Pixel</span>
            <span style={{ color: "var(--pixel-cyan)" }}>Passport</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              )}
              style={
                pathname.startsWith(link.href)
                  ? { background: "var(--surface-soft)", color: "var(--passport-gold)" }
                  : {}
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <WalletConnectButton />
      </div>
    </nav>
  );
}
