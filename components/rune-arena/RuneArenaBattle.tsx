"use client";
import { useState } from "react";
import type { RuneBattle } from "@/types";
import { BattleNarrationPanel } from "./BattleNarrationPanel";
import { ArenaActionPanel } from "./ArenaActionPanel";
import { BattleResultModal } from "./BattleResultModal";

interface RuneArenaBattleProps {
  battle: RuneBattle;
  passportId: string;
  onUpdate: (b: RuneBattle) => void;
}

export function RuneArenaBattle({ battle, passportId, onUpdate }: RuneArenaBattleProps) {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  async function startBattle() {
    setLoading(true);
    const res = await fetch(`/api/rune-arena/battles/${battle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    if (data.battle) onUpdate(data.battle);
    setLoading(false);
  }

  async function submitAction(action: string) {
    setLoading(true);
    const res = await fetch(`/api/rune-arena/battles/${battle.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, passport_id: passportId }),
    });
    const data = await res.json();
    if (data.battle) {
      onUpdate(data.battle);
      if (data.battle.status === "finished") setShowResult(true);
    }
    setLoading(false);
  }

  const opp = (battle as unknown as Record<string, unknown>).opponent as Record<string, unknown> | undefined;
  const playerHP = (battle as unknown as Record<string, unknown>).player_hp as number ?? 100;
  const oppHP = opp?.hp as number ?? 100;

  return (
    <div className="space-y-4">
      {/* Battle header */}
      <div className="rounded-2xl p-6 border" style={{ background: "rgba(249,115,115,0.08)", borderColor: "rgba(249,115,115,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: "#F97373" }}>YOU</div>
            <div className="text-2xl font-bold">❤️ {playerHP}/100</div>
          </div>
          <div className="text-2xl">⚔️</div>
          <div className="text-right">
            <div className="text-xs font-mono mb-1" style={{ color: "#F97373" }}>
              {opp?.name as string ?? "Opponent"}
            </div>
            <div className="text-2xl font-bold">💀 {oppHP}</div>
          </div>
        </div>

        {/* HP bars */}
        <div className="space-y-2">
          <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div className="h-full rounded-full" style={{ width: `${playerHP}%`, background: "var(--success)" }} />
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (oppHP / 80) * 100)}%`, background: "var(--rune-red)" }} />
          </div>
        </div>
      </div>

      {/* Narration */}
      <BattleNarrationPanel narration={battle.narration} />

      {/* Actions */}
      {battle.status === "pending" && (
        <button onClick={startBattle} disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#F97373", color: "#090A12" }}>
          {loading ? "Starting…" : "Start Battle"}
        </button>
      )}
      {battle.status === "active" && (
        <ArenaActionPanel onAction={submitAction} loading={loading} loadout={battle.loadout} />
      )}
      {battle.status === "finished" && !showResult && (
        <button onClick={() => setShowResult(true)}
          className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90"
          style={{ background: "var(--passport-gold)", color: "#090A12" }}>
          View Result
        </button>
      )}

      {showResult && (
        <BattleResultModal
          battle={battle}
          passportId={passportId}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}
