"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import type { Achievement } from "@/types";

export default function AchievementsPage() {
  const { address, isConnected } = useAccount();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) { setLoading(false); return; }
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d?.id) {
          const res = await fetch(`/api/passports/${d.id}`).then((r) => r.json());
          // Achievements are fetched from Supabase directly
          const { createClient } = await import("@/lib/supabase/client");
          const db = createClient();
          const { data } = await db.from("achievements").select("*").eq("passport_id", d.id);
          setAchievements(data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Earned across RuneArena, ChainFarm, and VoidRun.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="text-2xl animate-spin">⟳</div>
        </div>
      )}

      {!loading && !isConnected && (
        <div className="text-center py-16">
          <p style={{ color: "var(--text-muted)" }}>Connect your wallet to view achievements.</p>
        </div>
      )}

      {!loading && isConnected && achievements.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-lg font-bold mb-2">No achievements yet</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Play games and complete challenges to earn achievements.
          </p>
        </div>
      )}

      {!loading && achievements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {achievements.map((ach) => (
            <AchievementBadge key={ach.id} achievement={ach} />
          ))}
        </div>
      )}
    </div>
  );
}
