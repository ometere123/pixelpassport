const CROP_ICONS: Record<string, string> = {
  ember_grain: "🌾",
  moonroot: "🌿",
  chain_corn: "🌽",
  void_mushroom: "🍄",
  rune_pepper: "🌶️",
};

interface ResourcePanelProps {
  resources: Record<string, number>;
}

export function ResourcePanel({ resources }: ResourcePanelProps) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h3 className="font-bold mb-3">Resources</h3>
      <div className="space-y-2">
        {Object.entries(resources).map(([key, amount]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{CROP_ICONS[key] ?? "📦"}</span>
              <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
            </div>
            <span className="font-mono text-sm" style={{ color: "#65D46E" }}>
              {amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
