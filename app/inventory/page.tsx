"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { InventoryGrid } from "@/components/inventory/InventoryGrid";
import type { CanonicalItem } from "@/types";

export default function InventoryPage() {
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) { setLoading(false); return; }
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d?.id) {
          setPassportId(d.id);
          const itemsRes = await fetch(`/api/inventory/${d.id}`).then((r) => r.json());
          setItems(itemsRes?.items ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <h1 className="text-xl font-bold mb-2">Connect your wallet</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>to view your inventory.</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-2xl animate-spin">⟳</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {items.length} items across all worlds
          </p>
        </div>
        {items.length > 0 && passportId && (
          <Link href="/translate"
            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: "var(--pixel-cyan)", color: "#090A12" }}>
            Translate Item →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-lg font-bold mb-2">No items yet</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Win battles in RuneArena or complete runs in VoidRun to earn items.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/games/rune-arena"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#F97373", color: "#090A12" }}>
              Play RuneArena
            </Link>
            <Link href="/games/void-run"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#8B5CF6", color: "white" }}>
              Enter VoidRun
            </Link>
          </div>
        </div>
      ) : (
        <InventoryGrid items={items} />
      )}
    </div>
  );
}
