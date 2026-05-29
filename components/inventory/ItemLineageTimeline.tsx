import type { CanonicalItem, ItemTranslation } from "@/types";
import { gameColor, gameLabel } from "@/lib/utils/cn";

interface ItemLineageTimelineProps {
  item: CanonicalItem;
  translations: ItemTranslation[];
}

export function ItemLineageTimeline({ item, translations }: ItemLineageTimelineProps) {
  const steps = [
    { game: item.origin_game, name: item.name, type: "origin" },
    ...translations.map((t) => ({ game: t.target_game, name: t.translated_name, type: "translation" })),
  ];

  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-xs font-mono mb-4" style={{ color: "var(--text-muted)" }}>ITEM LINEAGE</div>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border mb-2"
                style={{ background: `${gameColor(step.game)}15`, borderColor: `${gameColor(step.game)}40` }}
              >
                {step.type === "origin" ? "🌟" : "🔄"}
              </div>
              <div className="text-xs font-semibold w-20 truncate">{step.name}</div>
              <div className="text-xs mt-0.5" style={{ color: gameColor(step.game) }}>
                {gameLabel(step.game)}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-2 text-sm flex-shrink-0" style={{ color: "var(--pixel-cyan)" }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
