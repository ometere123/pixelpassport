"use client";
import { useState, useEffect } from "react";
import type { CanonicalItem, ChainFarm } from "@/types";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { useFarmItem } from "@/lib/genlayer/actions";

interface FarmToolPanelProps {
  farmId: string;
  passportId: string;
  onUpdate: (f: ChainFarm) => void;
}

export function FarmToolPanel({ farmId, passportId, onUpdate }: FarmToolPanelProps) {
  const { write, ready } = useGenLayer();
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!passportId) return;
    fetch(`/api/inventory/${passportId}`)
      .then((r) => r.json())
      .then((d) => setItems(d?.items ?? []))
      .catch(() => {});
  }, [passportId]);

  const farmItems = items.filter((i) =>
    ["tool", "seed", "fertilizer", "harvest_relic", "translated_tool"].includes(i.class)
  );

  async function applyItem(item: CanonicalItem) {
    if (!ready) return;
    setApplying(item.id);
    setError("");
    try {
      const out = await useFarmItem(write, {
        farmId,
        itemId: item.id,
        translatedItem: { ...item },
        passportId,
      });
      if (out.farm) onUpdate(out.farm as unknown as ChainFarm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h3 className="font-bold mb-3">Farm Tools</h3>
      {farmItems.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No tools available. Translate a weapon from RuneArena to get a farm tool.
        </p>
      ) : (
        <div className="space-y-2">
          {farmItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg"
              style={{ background: "var(--surface-soft)" }}>
              <div>
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.class}</div>
              </div>
              <button onClick={() => applyItem(item)} disabled={applying !== null}
                className="px-3 py-1 rounded text-xs font-semibold hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(101,212,110,0.2)", color: "#65D46E" }}>
                {applying === item.id ? "Applying…" : "Apply"}
              </button>
            </div>
          ))}
        </div>
      )}
      {applying && (
        <div className="mt-3 p-2 rounded text-xs shimmer"
          style={{ background: "rgba(101,212,110,0.06)", color: "#65D46E" }}>
          ⬡ GenLayer LLM evaluating item effect on your farm…
        </div>
      )}
      {error && (
        <div className="mt-3 p-2 rounded text-xs"
          style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
