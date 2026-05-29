interface BattleNarrationPanelProps {
  narration: string[];
}

export function BattleNarrationPanel({ narration }: BattleNarrationPanelProps) {
  return (
    <div className="rounded-xl p-5 border max-h-48 overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>BATTLE LOG</div>
      {narration.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Awaiting battle start…</p>
      ) : (
        <div className="space-y-2">
          {narration.map((line, i) => (
            <div key={i} className="text-sm" style={{ color: i === narration.length - 1 ? "var(--text-main)" : "var(--text-muted)" }}>
              <span className="text-xs font-mono mr-2" style={{ color: "rgba(249,115,115,0.6)" }}>
                T{i + 1}
              </span>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
