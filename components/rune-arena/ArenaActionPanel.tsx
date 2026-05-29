"use client";

const ACTIONS = [
  { key: "strike", label: "Strike", icon: "⚔️", desc: "Direct attack. Deals 15-25 damage." },
  { key: "guard", label: "Guard", icon: "🛡️", desc: "Reduce incoming damage by 60%." },
  { key: "focus", label: "Focus", icon: "🧿", desc: "Double next attack damage." },
  { key: "rune_cast", label: "Rune Cast", icon: "✨", desc: "Magical 20-35 damage. 30% miss." },
  { key: "item_action", label: "Item", icon: "💎", desc: "Use equipped item for bonus effect." },
];

interface ArenaActionPanelProps {
  onAction: (action: string) => void;
  loading: boolean;
  loadout: string[];
}

export function ArenaActionPanel({ onAction, loading, loadout }: ArenaActionPanelProps) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>CHOOSE ACTION</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTIONS.filter((a) => a.key !== "item_action" || loadout.length > 0).map((action) => (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
            disabled={loading}
            className="p-3 rounded-lg border text-left transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: "var(--surface-soft)", borderColor: "var(--border)" }}
            title={action.desc}
          >
            <div className="text-lg mb-1">{action.icon}</div>
            <div className="text-sm font-semibold">{action.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
