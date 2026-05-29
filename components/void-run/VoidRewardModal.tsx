"use client";
import { useState } from "react";
import Link from "next/link";
import type { VoidRun } from "@/types";

interface VoidRewardModalProps {
  run: VoidRun;
  passportId: string;
  onClose: () => void;
}

export function VoidRewardModal({ run, passportId, onClose }: VoidRewardModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<Record<string, unknown> | null>(null);

  async function claimReward() {
    setClaiming(true);
    const res = await fetch(`/api/void-run/runs/${run.id}/claim-reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passport_id: passportId }),
    });
    const d = await res.json();
    if (d.item) setReward(d.item as Record<string, unknown>);
    setClaiming(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 border"
        style={{ background: "var(--surface)", borderColor: "rgba(139,92,246,0.4)" }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌀</div>
          <h2 className="text-2xl font-bold">Void Conquered</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Score: {run.score}
          </p>
        </div>

        {!reward && run.status !== "claimed" && (
          <button onClick={claimReward} disabled={claiming}
            className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 mb-3"
            style={{ background: "#8B5CF6", color: "white" }}>
            {claiming ? "GenLayer generating void reward…" : "Claim Void Reward"}
          </button>
        )}

        {reward && (
          <div className="mb-4 p-4 rounded-xl border"
            style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)" }}>
            <div className="text-xs font-mono mb-2" style={{ color: "#8B5CF6" }}>VOID REWARD</div>
            <div className="font-bold">{reward.name as string}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {reward.class as string} · {reward.rarity as string} · PL {reward.power_level as number}
            </div>
            <div className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
              {reward.lore as string}
            </div>
            <Link href="/translate" className="block mt-3 text-xs text-center" style={{ color: "var(--pixel-cyan)" }}>
              → Translate to another world
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/games/void-run" className="flex-1 py-2.5 rounded-lg text-sm text-center font-semibold hover:opacity-80"
            style={{ background: "var(--surface-soft)" }}>
            Back to Void
          </Link>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-80"
            style={{ background: "#8B5CF6", color: "white" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
