"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import type { ActivityEntry } from "@/types";

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) { setLoading(false); return; }
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d?.id) {
          setPassportId(d.id);
          const act = await fetch(`/api/activity/${d.id}`).then((r) => r.json());
          setActivity(act?.entries ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity Feed</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your cross-game activity across the PixelPassport ecosystem.
        </p>
      </div>

      {!isConnected && (
        <div className="text-center py-16">
          <p style={{ color: "var(--text-muted)" }}>Connect your wallet to see your activity.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-2xl animate-spin">⟳</div>
        </div>
      )}

      {!loading && isConnected && (
        <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <ActivityFeed entries={activity} />
        </div>
      )}
    </div>
  );
}
