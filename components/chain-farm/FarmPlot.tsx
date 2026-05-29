import type { FarmPlot } from "@/types";

const CROP_ICONS: Record<string, string> = {
  ember_grain: "🌾",
  moonroot: "🌿",
  chain_corn: "🌽",
  void_mushroom: "🍄",
  rune_pepper: "🌶️",
};

interface FarmPlotCellProps {
  plot: FarmPlot;
  onPlant: () => void;
  onHarvest: () => void;
  loading: boolean;
}

export function FarmPlotCell({ plot, onPlant, onHarvest, loading }: FarmPlotCellProps) {
  const isReady = plot.status === "ready" || (plot.status === "planted" && plot.ready_at && new Date(plot.ready_at) <= new Date());

  return (
    <div
      className="rounded-xl p-4 border text-center transition-all"
      style={{
        background: plot.status === "empty" ? "var(--surface-soft)" : "rgba(101,212,110,0.08)",
        borderColor: plot.status === "empty" ? "var(--border)" : "rgba(101,212,110,0.3)",
        minHeight: 100,
      }}
    >
      <div className="text-2xl mb-2">
        {plot.status === "empty" ? "🟫" : CROP_ICONS[plot.crop ?? ""] ?? "🌱"}
      </div>
      <div className="text-xs font-semibold mb-1 capitalize">
        {plot.crop?.replace(/_/g, " ") ?? "Empty"}
      </div>
      {plot.yield_modifier && plot.yield_modifier > 1 && (
        <div className="text-xs mb-1" style={{ color: "#65D46E" }}>
          {plot.yield_modifier}x yield
        </div>
      )}

      {plot.status === "empty" && (
        <button onClick={onPlant} disabled={loading}
          className="mt-2 w-full py-1 rounded text-xs font-semibold hover:opacity-80 disabled:opacity-50"
          style={{ background: "rgba(101,212,110,0.2)", color: "#65D46E" }}>
          Plant
        </button>
      )}
      {plot.status === "planted" && !isReady && (
        <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Growing…</div>
      )}
      {(isReady || plot.status === "ready") && (
        <button onClick={onHarvest} disabled={loading}
          className="mt-2 w-full py-1 rounded text-xs font-semibold hover:opacity-80 disabled:opacity-50"
          style={{ background: "rgba(101,212,110,0.3)", color: "#65D46E" }}>
          Harvest
        </button>
      )}
    </div>
  );
}
