"use client";
import { useState, useEffect } from "react";
import type { CanonicalItem } from "@/types";

interface ArenaLoadoutSelectorProps {
  passportId: string;
  onConfirm: (loadout: string[]) => void;
}

export function ArenaLoadoutSelector({ passportId, onConfirm }: ArenaLoadoutSelectorProps) {
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!passportId) return;
    fetch(`/api/inventory/${passportId}`)
      .then((r) => r.json())
      .then((data) => setItems(data?.items ?? []))
      .catch(() => {});
  }, [passportId]);

  const arenaItems = items.filter((i) =>
    ["weapon", "armor", "rune", "combat_relic", "translated_relic"].includes(i.class)
  );

  // Provide default starter items if none owned
  const displayItems =
    arenaItems.length > 0
      ? arenaItems
      : ([
          { id: "starter_rune_1", name: "Iron Rune", class: "rune", rarity: "common" as const, power_level: 10, traits: [], lore: "", origin_game: "rune-arena", owner_passport_id: "", metadata_uri: null, created_at: "" } as CanonicalItem,
          { id: "starter_sword", name: "Rusted Blade", class: "weapon", rarity: "common" as const, power_level: 12, traits: [], lore: "", origin_game: "rune-arena", owner_passport_id: "", metadata_uri: null, created_at: "" } as CanonicalItem,
        ]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Choose up to 5 items for your loadout. Translated items from other games are welcome.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="p-4 rounded-xl border text-left transition-all"
            style={{
              background: selected.includes(item.id) ? "rgba(249,115,115,0.15)" : "var(--surface)",
              borderColor: selected.includes(item.id) ? "rgba(249,115,115,0.5)" : "var(--border)",
            }}
          >
            <div className="font-semibold text-sm">{item.name}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {item.class} · PL {item.power_level}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          onConfirm(
            selected.length > 0
              ? selected
              : displayItems.slice(0, 2).map((i) => i.id)
          )
        }
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: "#F97373", color: "#090A12" }}
      >
        {selected.length > 0 ? `Enter Battle with ${selected.length} items` : "Enter Battle (default loadout)"}
      </button>
    </div>
  );
}
