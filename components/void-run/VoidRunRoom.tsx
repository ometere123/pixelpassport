"use client";
import { useState, useEffect, useRef } from "react";
import type { VoidRun, VoidRoom } from "@/types";
import { VoidPuzzlePanel } from "./VoidPuzzlePanel";
import { VoidRewardModal } from "./VoidRewardModal";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { generateRoom as generateRoomTx, judgePuzzleAnswer, claimVoidReward } from "@/lib/genlayer/actions";

interface VoidRunRoomProps {
  run: VoidRun;
  passportId: string;
  onUpdate: (r: VoidRun) => void;
}

function getCurrentRoom(run: VoidRun): VoidRoom | null {
  const rooms = (run.rooms ?? []) as VoidRoom[];
  if (rooms.length === 0) return null;
  const idx = Math.min(run.current_room, rooms.length - 1);
  return rooms[idx] ?? null;
}

export function VoidRunRoom({ run, passportId, onUpdate }: VoidRunRoomProps) {
  const { write, ready } = useGenLayer();
  const [room, setRoom] = useState<VoidRoom | null>(getCurrentRoom(run));
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "generating" | "judging" | "claiming">("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showReward, setShowReward] = useState(false);
  const generatedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setRoom(getCurrentRoom(run));
  }, [run.current_room, run.rooms, run]);

  async function ensureRoom() {
    if (!ready || loading) return;
    if (run.status !== "active") return;
    const existing = getCurrentRoom(run);
    if (existing) return;
    if (generatedRef.current.has(run.current_room)) return;
    generatedRef.current.add(run.current_room);

    setLoading(true);
    setPhase("generating");
    setError("");
    try {
      const out = await generateRoomTx(write, { runId: run.id, passportId });
      setTxHash(out.tx.hash);
      if (out.run) onUpdate(out.run as unknown as VoidRun);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Room generation failed");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  }

  useEffect(() => {
    ensureRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.current_room, ready]);

  async function submitAnswer(answer: string) {
    if (!ready) return;
    setLoading(true);
    setError("");
    setPhase("judging");
    try {
      const out = await judgePuzzleAnswer(write, {
        runId: run.id,
        roomIndex: run.current_room,
        answer,
        passportId,
      });
      setTxHash(out.tx.hash);
      if (out.run) {
        onUpdate(out.run as unknown as VoidRun);
        const updated = out.run as unknown as VoidRun;
        if (updated.status === "finished") {
          setShowReward(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Answer judging failed");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  }

  async function claimReward() {
    if (!ready) return;
    setLoading(true);
    setPhase("claiming");
    setError("");
    try {
      const out = await claimVoidReward(write, { runId: run.id, passportId });
      setTxHash(out.tx.hash);
      if (out.run) onUpdate(out.run as unknown as VoidRun);
      setShowReward(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  }

  const total = run.total_rooms ?? 5;
  const progress = `${run.current_room}/${total}`;
  const phaseLabel = {
    idle: "",
    generating: "LLM is generating this room…",
    judging: "LLM is judging your answer…",
    claiming: "Minting your reward item…",
  }[phase];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Void Run</h1>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Room {progress} · Score: {run.score}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-sm font-mono"
          style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
          {run.status}
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-soft)" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(run.current_room / total) * 100}%`, background: "#8B5CF6" }} />
      </div>

      {loading && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2 shimmer"
          style={{ background: "rgba(139,92,246,0.06)", color: "#8B5CF6" }}>
          <span className="animate-spin">🌀</span>
          {phaseLabel}
        </div>
      )}
      {txHash && !loading && (
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

      {room && run.status === "active" && (
        <VoidPuzzlePanel room={room} onAnswer={submitAnswer} loading={loading} />
      )}

      {(run.status === "finished" || run.status === "claimed") && !showReward && (
        <div className="rounded-2xl p-8 border text-center"
          style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}>
          <div className="text-4xl mb-3">🏆</div>
          <h2 className="text-xl font-bold mb-2">Run Complete!</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Final score: {run.score}
          </p>
          {run.status === "finished" && (
            <button onClick={claimReward} disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: "#8B5CF6", color: "white" }}>
              {loading ? "Claiming…" : "Claim Void Reward"}
            </button>
          )}
        </div>
      )}

      {showReward && (
        <VoidRewardModal run={run} passportId={passportId} onClose={() => setShowReward(false)} />
      )}
    </div>
  );
}
