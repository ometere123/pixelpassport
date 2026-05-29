"use client";
import { useState } from "react";
import type { VoidRoom } from "@/types";
import { PuzzleJudgementPanel } from "./PuzzleJudgementPanel";

interface VoidPuzzlePanelProps {
  room: VoidRoom;
  onAnswer: (answer: string) => void;
  loading: boolean;
}

export function VoidPuzzlePanel({ room, onAnswer, loading }: VoidPuzzlePanelProps) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {/* Room card */}
      <div className="rounded-2xl p-6 border" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}>
        <div className="text-xs font-mono mb-2" style={{ color: "#8B5CF6" }}>
          ROOM {room.index + 1} · {room.type?.toUpperCase()}
        </div>
        <h2 className="text-lg font-bold mb-3">{(room as unknown as Record<string, unknown>).title as string ?? `The ${room.type} Chamber`}</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          {room.description}
        </p>

        {room.puzzle && (
          <div className="p-4 rounded-xl border"
            style={{ background: "var(--surface)", borderColor: "rgba(56,217,248,0.2)" }}>
            <div className="text-xs font-mono mb-2" style={{ color: "var(--pixel-cyan)" }}>THE PUZZLE</div>
            <p className="text-sm font-medium">{room.puzzle}</p>
          </div>
        )}
      </div>

      {/* Answer input */}
      {room.type === "puzzle" && !room.completed && !room.judgement && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <label className="block text-sm font-medium mb-2">Your Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here… Be creative. GenLayer appreciates nuanced responses."
            rows={3}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
          <button
            onClick={() => { if (answer.trim()) { onAnswer(answer.trim()); setAnswer(""); } }}
            disabled={loading || !answer.trim()}
            className="mt-3 w-full py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: "#8B5CF6", color: "white" }}
          >
            {loading ? "GenLayer judging…" : "Submit Answer"}
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
            ⬡ GenLayer evaluates with a 0.0–1.0 confidence score. No hardcoded answers.
          </p>
        </div>
      )}

      {/* Non-puzzle room */}
      {room.type !== "puzzle" && !room.completed && (
        <button
          onClick={() => onAnswer("proceed")}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#8B5CF6", color: "white" }}
        >
          {loading ? "Processing…" : "Proceed →"}
        </button>
      )}

      {/* Judgement panel */}
      {room.judgement && <PuzzleJudgementPanel judgement={room.judgement} />}
    </div>
  );
}
