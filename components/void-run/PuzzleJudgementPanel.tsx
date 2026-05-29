import type { PuzzleJudgement } from "@/types";

interface PuzzleJudgementPanelProps {
  judgement: PuzzleJudgement;
}

export function PuzzleJudgementPanel({ judgement }: PuzzleJudgementPanelProps) {
  const confidencePct = Math.round(judgement.confidence * 100);
  return (
    <div className="rounded-xl p-5 border" style={{
      background: judgement.accepted ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      borderColor: judgement.accepted ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
    }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{judgement.accepted ? "✅" : "❌"}</span>
        <span className="font-bold">{judgement.summary}</span>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
          <span>GenLayer Confidence</span>
          <span>{confidencePct}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "var(--surface-soft)" }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${confidencePct}%`,
              background: judgement.accepted ? "var(--success)" : "var(--danger)",
            }} />
        </div>
      </div>

      <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{judgement.reasoning}</p>

      <div className="text-xs font-mono p-2 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
        Next hint: {judgement.next_room_hint}
      </div>
    </div>
  );
}
