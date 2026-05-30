"use client";
import { useState } from "react";
import type { RuneBattle } from "@/types";
import { BattleNarrationPanel } from "./BattleNarrationPanel";
import { ArenaActionPanel } from "./ArenaActionPanel";
import { BattleResultModal } from "./BattleResultModal";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { submitBattleAction, claimBattleReward, awardXp, awardAchievement, startBattle } from "@/lib/genlayer/actions";

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

function deriveHP(battle: RuneBattle, init: { playerHP: number; oppHP: number; oppMaxHP: number }) {
  const turns = (battle.turns ?? []) as unknown as Record<string, unknown>[];
  if (turns.length <= 1) return { playerHP: init.playerHP, oppHP: init.oppHP };
  const last = turns[turns.length - 1];
  return {
    playerHP: Number(last.player_hp_after ?? init.playerHP),
    oppHP: Number(last.opp_hp_after ?? init.oppHP),
  };
}

export function RuneArenaBattle({ battle, passportId, onUpdate }: RuneArenaBattleProps) {
  const { write, ready } = useGenLayer();
  const init = getInitState(battle);
  const derived = deriveHP(battle, init);
  const [playerHP, setPlayerHP] = useState(derived.playerHP);
  const [oppHP, setOppHP]       = useState(derived.oppHP);
  const [oppMaxHP]              = useState(init.oppMaxHP);
  const [oppName]               = useState(init.oppName);
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState<"idle" | "signing" | "claiming">("idle");
  const [error, setError]       = useState("");
  const [txHash, setTxHash]     = useState("");
  const [showResult, setShowResult] = useState(false);

  async function submitAction(action: string) {
    if (!ready) return;
    setLoading(true);
    setError("");
    setPhase("signing");
    try {
      const out = await submitBattleAction(write, {
        battleId: battle.id,
        passportId,
        action,
      });
      setTxHash(out.tx.hash);
      if (out.battle) {
        onUpdate(out.battle);
        const next = deriveHP(out.battle, init);
        setPlayerHP(next.playerHP);
        setOppHP(next.oppHP);
        if (out.battle.status === "finished") {
          const playerWon = out.battle.winner === "player";
          setPhase("claiming");
          if (playerWon) {
            try {
              const claim = await claimBattleReward(write, { battleId: battle.id, passportId });
              if (claim.battle) onUpdate(claim.battle);
              // Award XP + first-win achievement on-chain
              const xpAmount = Number((out.battle as { xp_earned?: number }).xp_earned ?? 250);
              if (xpAmount > 0) {
                try {
                  await awardXp(write, {
                    passportId,
                    gameId: "rune-arena",
                    xp: xpAmount,
                    reason: `RuneArena battle won (${battle.id})`,
                  });
                } catch (xpErr) {
                  console.error("XP award failed", xpErr);
                }
              }
              try {
                await awardAchievement(write, {
                  passportId,
                  gameId: "rune-arena",
                  achievement: {
                    name: "First Blood",
                    description: "Won your first RuneArena battle",
                    icon: "⚔️",
                    rarity: "common",
                  },
                });
              } catch (achErr) {
                // already_awarded is fine; ignore
                console.warn("Achievement award:", achErr);
              }
            } catch (claimErr) {
              console.error("Reward claim failed", claimErr);
            }
          }
          setShowResult(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  }

  const playerPct = Math.max(0, Math.min(100, playerHP));
  const oppPct    = Math.max(0, Math.min(100, (oppHP / oppMaxHP) * 100));

  return (
    <div className="space-y-4">
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

      <BattleNarrationPanel narration={battle.narration} />

      {loading && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2 shimmer"
          style={{ background: "rgba(56,217,248,0.06)", color: "var(--pixel-cyan)" }}>
          <span className="animate-spin">⟳</span>
          {phase === "signing" && "GenLayer LLM is adjudicating the turn…"}
          {phase === "claiming" && "Minting your reward item on-chain…"}
        </div>
      )}

      {txHash && (
        <div className="p-2 rounded text-xs font-mono break-all"
          style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
          tx: {txHash}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {battle.status === "pending" && (
        <button
          onClick={async () => {
            if (!ready) return;
            setLoading(true);
            setError("");
            setPhase("signing");
            try {
              const out = await startBattle(write, { battleId: battle.id, passportId });
              if (out.battle) onUpdate(out.battle);
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "Start failed");
            } finally {
              setLoading(false);
              setPhase("idle");
            }
          }}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#F97373", color: "#090A12" }}
        >
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
