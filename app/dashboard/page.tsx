"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { PassportCard } from "@/components/passport/PassportCard";
import { EcosystemXPBar } from "@/components/passport/EcosystemXPBar";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { GameCard } from "@/components/games/GameCard";
import { GAMES } from "@/lib/games/registry";
import type { Passport, CanonicalItem, ActivityEntry } from "@/types";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data?.id) {
          setPassport(data);
          const [itemsRes, actRes] = await Promise.all([
            fetch(`/api/inventory/${data.id}`).then((r) => r.json()),
            fetch(`/api/activity/${data.id}`).then((r) => r.json()),
          ]);
          setItems(itemsRes?.items ?? []);
          setActivity(actRes?.entries ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold mb-2">Connect your wallet</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Connect your wallet to access your PixelPassport dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-spin">⟳</div>
          <p style={{ color: "var(--text-muted)" }}>Loading your passport…</p>
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🪪</div>
          <h1 className="text-xl font-bold mb-2">No passport found</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            You do not have a PixelPassport yet. Create one to start your cross-game journey.
          </p>
          <Link
            href="/passport/create"
            className="px-5 py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}
          >
            Create Passport
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Welcome back, <span style={{ color: "var(--passport-gold)" }}>{passport.username}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PassportCard passport={passport} />
          <EcosystemXPBar xp={passport.ecosystem_xp} level={passport.level} />

          {/* Quick actions */}
          <div className="rounded-xl p-4 border space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>QUICK ACTIONS</div>
            <Link href="/inventory" className="block px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
              style={{ background: "var(--surface-soft)", color: "var(--text-main)" }}>
              📦 View Inventory ({items.length} items)
            </Link>
            <Link href="/translate" className="block px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
              style={{ background: "var(--surface-soft)", color: "var(--pixel-cyan)" }}>
              🔄 Translate Item
            </Link>
            <Link href={`/passport/${passport.id}`} className="block px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
              style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
              🪪 Public Profile
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Games */}
          <div>
            <h2 className="text-lg font-bold mb-3">Your Worlds</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {GAMES.map((game) => (
                <GameCard key={game.id} game={game} compact />
              ))}
            </div>
          </div>

          {/* Recent items */}
          {items.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Recent Items</h2>
                <Link href="/inventory" className="text-xs" style={{ color: "var(--pixel-cyan)" }}>
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/inventory/${item.id}`}
                    className="p-3 rounded-lg border text-center hover:opacity-80 transition-opacity"
                    style={{ background: "var(--surface-soft)", borderColor: "var(--border)" }}>
                    <div className="text-xl mb-1">
                      {item.class === "weapon" ? "⚔️" : item.class === "tool" ? "🔧" : item.class === "relic" ? "💎" : "📦"}
                    </div>
                    <div className="text-xs font-semibold truncate">{item.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.rarity}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="font-bold mb-4">Activity Feed</h2>
            <ActivityFeed entries={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
