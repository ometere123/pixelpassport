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

function getInitState(battle: RuneBattle): { playerHP: number; oppHP: number; oppName: string; oppMaxHP: number } {
  const turns = (battle.turns ?? []) as unknown as Record<string, unknown>[];
  const init = turns[0] ?? {};
  const opp = (init.opponent ?? {}) as Record<string, unknown>;
  return {
    playerHP:  (init.player_hp  as number) ?? 100,
    oppHP:     (opp.hp          as number) ?? 100,
    oppName:   (opp.name        as string) ?? "Opponent",
    oppMaxHP:  (opp.hp          as number) ?? 100,
  };
}

export function RuneArenaBattle({ battle, passportId, onUpdate }: RuneArenaBattleProps) {
  const init = getInitState(battle);
  const [playerHP, setPlayerHP] = useState(init.playerHP);
  const [oppHP,    setOppHP]    = useState(init.oppHP);
  const [oppMaxHP]              = useState(init.oppMaxHP);
  const [oppName]               = useState(init.oppName);
  const [loading,  setLoading]  = useState(false);
  const [showResult, setShowResult] = useState(false);

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
      // Update HP from API response
      if (typeof data.player_hp === "number") setPlayerHP(data.player_hp);
      if (typeof data.opp_hp    === "number") setOppHP(data.opp_hp);
      if (data.battle.status === "finished")  setShowResult(true);
    }
    setLoading(false);
  }

  const playerPct = Math.max(0, Math.min(100, playerHP));
  const oppPct    = Math.max(0, Math.min(100, (oppHP / oppMaxHP) * 100));

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
            <div className="text-xs font-mono mb-1" style={{ color: "#F97373" }}>Opponent</div>
            <div className="text-2xl font-bold">💀 {oppHP}</div>
          </div>
        </div>

        {/* HP bars */}
        <div className="space-y-2">
          <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${playerPct}%`, background: "var(--success, #65D46E)" }} />
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${oppPct}%`, background: "#F97373" }} />
          </div>
        </div>

        <div className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          vs {oppName}
        </div>
      </div>

      {/* Narration */}
      <BattleNarrationPanel narration={battle.narration} />

      {/* Actions */}
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
