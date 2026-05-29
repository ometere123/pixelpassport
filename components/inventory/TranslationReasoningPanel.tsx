"use client";
import { useState } from "react";
import type { ItemTranslation } from "@/types";
import { gameColor, gameLabel } from "@/lib/utils/cn";

interface TranslationReasoningPanelProps {
  translation: ItemTranslation;
}

export function TranslationReasoningPanel({ translation }: TranslationReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-3">
          <div className="text-xl">🔄</div>
          <div>
            <div className="font-semibold text-sm">{translation.translated_name}</div>
            <div className="text-xs mt-0.5" style={{ color: gameColor(translation.target_game) }}>
              in {gameLabel(translation.target_game)}
            </div>
          </div>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Class</div>
              <div>{translation.translated_class}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Power Level</div>
              <div style={{ color: "var(--xp-blue)" }}>{translation.translated_power_level}</div>
            </div>
          </div>

          {translation.abilities.length > 0 && (
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Abilities</div>
              <div className="space-y-1">
                {translation.abilities.map((ab, i) => (
                  <div key={i} className="text-xs px-2 py-1 rounded"
                    style={{ background: "var(--surface)", color: "var(--text-main)" }}>
                    · {ab}
                  </div>
                ))}
              </div>
            </div>
          )}

          {translation.visual_direction && (
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Visual Direction</div>
              <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>{translation.visual_direction}</div>
            </div>
          )}

          {translation.reasoning && (
            <div className="p-3 rounded-lg text-xs font-mono"
              style={{ background: "rgba(56,217,248,0.06)", color: "var(--pixel-cyan)" }}>
              <span style={{ color: "var(--text-muted)" }}>⬡ GenLayer: </span>
              {translation.reasoning}
            </div>
          )}

          {translation.balance_notes && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Balance: {translation.balance_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
