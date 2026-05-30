"use client";

/**
 * Multi-form 3D viewer. Shows the canonical item + each translated form
 * (one per target game). Clicking a tab morphs the 3D model in real time
 * via the ItemViewer3D component.
 *
 * This is THE protocol-demo moment in physical form: same canonical item,
 * three different visual identities, AI reasoning shown alongside.
 */

import { useState } from "react";
import type { CanonicalItem, ItemTranslation, GameId } from "@/types";
import { ItemViewer3D } from "./ItemViewer3D";
import { gameColor, gameLabel } from "@/lib/utils/cn";

interface ItemTranslationMorphProps {
  item: CanonicalItem;
  translations: ItemTranslation[];
}

export function ItemTranslationMorph({ item, translations }: ItemTranslationMorphProps) {
  const [activeId, setActiveId] = useState<string>("canonical");

  // Build pseudo-item for each translated form so ItemViewer3D can render it
  const translatedItems: CanonicalItem[] = translations.map((t) => ({
    ...item,
    id: `${item.id}__${t.target_game}`,
    name: t.translated_name,
    class: t.translated_class,
    power_level: t.translated_power_level,
    origin_game: t.target_game as GameId,
  }));

  const active = activeId === "canonical"
    ? item
    : translatedItems.find((x) => x.id === activeId) ?? item;

  const activeTranslation = activeId === "canonical"
    ? null
    : translations.find((t) => `${item.id}__${t.target_game}` === activeId) ?? null;

  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveId("canonical")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: activeId === "canonical" ? "var(--passport-gold)" : "var(--surface-soft)",
            color: activeId === "canonical" ? "#090A12" : "var(--text-muted)",
          }}
        >
          ★ Canonical · {gameLabel(item.origin_game)}
        </button>
        {translations.map((t) => {
          const id = `${item.id}__${t.target_game}`;
          const isActive = activeId === id;
          const color = gameColor(t.target_game);
          return (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: isActive ? color : "var(--surface-soft)",
                color: isActive ? "#090A12" : "var(--text-muted)",
              }}
            >
              ⬡ {gameLabel(t.target_game)}
            </button>
          );
        })}
      </div>

      {/* 3D viewer */}
      <ItemViewer3D item={active} height={380} background="rgba(9,10,18,0.4)" />

      {/* Active form metadata */}
      <div className="rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-lg font-bold">{active.name}</h3>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            PL {active.power_level}
          </span>
        </div>
        <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          {active.class} ·{" "}
          <span style={{ color: gameColor(active.origin_game) }}>
            {gameLabel(active.origin_game)}
          </span>
        </div>

        {activeTranslation ? (
          <div className="space-y-2">
            {activeTranslation.abilities?.length > 0 && (
              <div>
                <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>
                  ABILITIES
                </div>
                {activeTranslation.abilities.map((a, i) => (
                  <div key={i} className="text-xs px-2 py-1 rounded mb-1"
                    style={{ background: "var(--surface-soft)" }}>· {a}</div>
                ))}
              </div>
            )}
            {activeTranslation.reasoning && (
              <div className="p-3 rounded-lg"
                style={{ background: "rgba(56,217,248,0.06)", borderLeft: "3px solid var(--pixel-cyan)" }}>
                <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>
                  GenLayer Reasoning
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {activeTranslation.reasoning}
                </p>
              </div>
            )}
          </div>
        ) : (
          item.lore && (
            <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
              {item.lore}
            </p>
          )
        )}
      </div>
    </div>
  );
}
