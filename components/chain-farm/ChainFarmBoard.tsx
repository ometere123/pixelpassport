"use client";
import { useState } from "react";
import type { ChainFarm, FarmPlot } from "@/types";
import { FarmPlotCell } from "./FarmPlot";
import { ResourcePanel } from "./ResourcePanel";
import { FarmToolPanel } from "./FarmToolPanel";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { plantCrop, harvestCrop } from "@/lib/genlayer/actions";

interface ChainFarmBoardProps {
  farm: ChainFarm;
  passportId: string;
  onUpdate: (f: ChainFarm) => void;
}

export function ChainFarmBoard({ farm, passportId, onUpdate }: ChainFarmBoardProps) {
  const { write, ready } = useGenLayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(null);

  async function plant(plotIndex: number, cropType: string) {
    if (!ready) return;
    setLoading(true);
    setError("");
    try {
      const out = await plantCrop(write, {
        farmId: farm.id,
        plotId: `plot_${plotIndex}`,
        crop: cropType,
        passportId,
      });
      setTxHash(out.tx.hash);
      if (out.farm) onUpdate(out.farm as unknown as ChainFarm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Plant failed");
    } finally {
      setLoading(false);
      setSelectedPlot(null);
    }
  }

  async function harvest(plotIndex: number) {
    if (!ready) return;
    setLoading(true);
    setError("");
    try {
      const out = await harvestCrop(write, {
        farmId: farm.id,
        plotId: `plot_${plotIndex}`,
        passportId,
      });
      setTxHash(out.tx.hash);
      if (out.farm) onUpdate(out.farm as unknown as ChainFarm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Harvest failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Farm</h1>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Level {farm.level} · {farm.xp} XP
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-sm font-mono"
          style={{ background: "rgba(101,212,110,0.15)", color: "#65D46E" }}>
          🌱 Active Farm
        </div>
      </div>

      {loading && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2 shimmer"
          style={{ background: "rgba(101,212,110,0.06)", color: "#65D46E" }}>
          <span className="animate-spin">⟳</span>
          Submitting to ChainFarm contract — waiting for consensus…
        </div>
      )}
      {txHash && !loading && (
        <div className="p-2 rounded text-xs font-mono break-all"
          style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
          last tx: {txHash}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-4">Plots</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(farm.plots ?? []).map((plot) => (
            <FarmPlotCell
              key={plot.id}
              plot={plot}
              onPlant={() => setSelectedPlot(plot)}
              onHarvest={() => harvest(plot.index)}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 border"
            style={{ background: "var(--surface)", borderColor: "rgba(101,212,110,0.3)" }}>
            <h3 className="font-bold mb-4">Plant in Plot {selectedPlot.index + 1}</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["ember_grain", "moonroot", "chain_corn", "void_mushroom", "rune_pepper"].map((crop) => (
                <button key={crop} onClick={() => plant(selectedPlot.index, crop)}
                  disabled={loading}
                  className="p-3 rounded-lg border text-left hover:opacity-80 disabled:opacity-50 transition-opacity"
                  style={{ background: "var(--surface-soft)", borderColor: "var(--border)" }}>
                  <div className="text-sm font-semibold capitalize">{crop.replace(/_/g, " ")}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedPlot(null)} className="w-full py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourcePanel resources={farm.resources} />
        <FarmToolPanel farmId={farm.id} passportId={passportId} onUpdate={onUpdate} />
      </div>
    </div>
  );
}
