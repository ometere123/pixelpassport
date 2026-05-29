"use client";
import { useState, useEffect } from "react";
import type { CanonicalItem, ChainFarm } from "@/types";

interface FarmToolPanelProps {
  farmId: string;
  passportId: string;
  onUpdate: (f: ChainFarm) => void;
}

export function FarmToolPanel({ farmId, passportId, onUpdate }: FarmToolPanelProps) {
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [applying, setApplying] = useState(false);

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
    setApplying(true);
    const res = await fetch(`/api/chain-farm/farms/${farmId}/use-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id, item }),
    });
    const d = await res.json();
    if (d.farm) onUpdate(d.farm);
    setApplying(false);
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
              <button onClick={() => applyItem(item)} disabled={applying}
                className="px-3 py-1 rounded text-xs font-semibold hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(101,212,110,0.2)", color: "#65D46E" }}>
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
