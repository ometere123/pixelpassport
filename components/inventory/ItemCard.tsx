import Link from "next/link";
import type { CanonicalItem } from "@/types";
import { rarityBorder, rarityColor, gameColor, gameLabel } from "@/lib/utils/cn";

const CLASS_ICONS: Record<string, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  rune: "✨",
  combat_relic: "💎",
  tool: "🔧",
  seed: "🌱",
  fertilizer: "🪣",
  harvest_relic: "🌾",
  relic: "💜",
  void_artifact: "🌀",
  puzzle_tool: "🧩",
  navigator: "🧭",
  translated_relic: "🔄",
  translated_tool: "🔄",
};

interface ItemCardProps {
  item: CanonicalItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/inventory/${item.id}`}
      className={`block rounded-xl p-4 border text-center transition-all hover:scale-[1.02] ${rarityBorder(item.rarity)}`}
      style={{ background: "var(--surface)" }}>
      <div className="text-2xl mb-2">{CLASS_ICONS[item.class] ?? "📦"}</div>
      <div className="text-xs font-semibold truncate mb-1">{item.name}</div>
      <div className={`text-xs ${rarityColor(item.rarity)}`}>{item.rarity}</div>
      <div className="text-xs mt-1" style={{ color: gameColor(item.origin_game) }}>
        {gameLabel(item.origin_game)}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
        PL {item.power_level}
      </div>
      {item.is_translated && (
        <div className="mt-2 text-xs font-mono" style={{ color: "var(--pixel-cyan)" }}>
          translated
        </div>
      )}
    </Link>
  );
}
