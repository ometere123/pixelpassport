"use client";
import { useState, useEffect } from "react";
import type { VoidRun, VoidRoom } from "@/types";
import { VoidPuzzlePanel } from "./VoidPuzzlePanel";
import { VoidRewardModal } from "./VoidRewardModal";

interface VoidRunRoomProps {
  run: VoidRun;
  passportId: string;
  onUpdate: (r: VoidRun) => void;
}

export function VoidRunRoom({ run, passportId, onUpdate }: VoidRunRoomProps) {
  const [room, setRoom] = useState<VoidRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    generateRoom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.current_room]);

  async function generateRoom() {
    if (run.status === "finished" || run.status === "claimed") return;
    setLoading(true);
    const res = await fetch(`/api/void-run/runs/${run.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_room" }),
    });
    const d = await res.json();
    if (d.room) setRoom(d.room);
    setLoading(false);
  }

  async function submitAnswer(answer: string) {
    setLoading(true);
    const res = await fetch(`/api/void-run/runs/${run.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, passport_id: passportId }),
    });
    const d = await res.json();
    if (d.run) {
      onUpdate(d.run);
      if (d.judgement?.accepted) {
        setTimeout(generateRoom, 1500);
      }
    }
    if (d.run?.status === "finished") setShowReward(true);
    setLoading(false);
  }

  const progress = `${run.current_room}/${run.total_rooms ?? 5}`;

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-soft)" }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(run.current_room / (run.total_rooms ?? 5)) * 100}%`, background: "#8B5CF6" }} />
      </div>

      {loading && !room && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-spin">🌀</div>
            <p style={{ color: "var(--text-muted)" }}>GenLayer generating room…</p>
          </div>
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
            <button onClick={() => setShowReward(true)}
              className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90"
              style={{ background: "#8B5CF6", color: "white" }}>
              Claim Void Reward
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
