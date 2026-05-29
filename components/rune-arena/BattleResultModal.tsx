"use client";
import { useState } from "react";
import Link from "next/link";
import type { RuneBattle } from "@/types";

interface BattleResultModalProps {
  battle: RuneBattle;
  passportId: string;
  onClose: () => void;
}

export function BattleResultModal({ battle, passportId, onClose }: BattleResultModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<Record<string, unknown> | null>(null);

  const won = battle.winner === "player";

  async function claimReward() {
    setClaiming(true);
    const res = await fetch(`/api/rune-arena/battles/${battle.id}/claim-reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passport_id: passportId }),
    });
    const data = await res.json();
    if (data.item) setReward(data.item as Record<string, unknown>);
    setClaiming(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 border"
        style={{ background: "var(--surface)", borderColor: won ? "rgba(246,200,95,0.4)" : "rgba(239,68,68,0.4)" }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{won ? "🏆" : "💀"}</div>
          <h2 className="text-2xl font-bold">{won ? "Victory!" : "Defeated"}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {won ? `You earned ${battle.xp_earned} XP` : "Better luck next time."}
          </p>
        </div>

        {won && !reward && !battle.reward_item_id && (
          <button onClick={claimReward} disabled={claiming}
            className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 mb-3"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}>
            {claiming ? "GenLayer generating reward…" : "Claim Reward Item"}
          </button>
        )}

        {reward && (
          <div className="mb-4 p-4 rounded-xl border"
            style={{ background: "rgba(246,200,95,0.08)", borderColor: "rgba(246,200,95,0.3)" }}>
            <div className="text-xs font-mono mb-2" style={{ color: "var(--passport-gold)" }}>REWARD ITEM</div>
            <div className="font-bold">{reward.name as string}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {reward.class as string} · {reward.rarity as string} · PL {reward.power_level as number}
            </div>
            <div className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
              {reward.lore as string}
            </div>
            <Link href="/translate" className="block mt-3 text-xs text-center"
              style={{ color: "var(--pixel-cyan)" }}>
              → Translate this item to another world
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/games/rune-arena"
            className="flex-1 py-2.5 rounded-lg text-sm text-center font-semibold hover:opacity-80"
            style={{ background: "var(--surface-soft)" }}>
            Back to Arena
          </Link>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-80"
            style={{ background: "#F97373", color: "#090A12" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
