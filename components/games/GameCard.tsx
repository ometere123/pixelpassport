import type { Game } from "@/types";
import Link from "next/link";

interface GameCardProps {
  game: Game;
  compact?: boolean;
}

export function GameCard({ game, compact }: GameCardProps) {
  if (compact) {
    return (
      <Link
        href={`/games/${game.id}`}
        className="block rounded-xl p-4 border transition-all hover:scale-[1.02]"
        style={{ background: `${game.color}0A`, borderColor: `${game.color}40` }}
      >
        <div className="text-2xl mb-2">{game.icon}</div>
        <div className="text-xs font-mono font-bold mb-1" style={{ color: game.color }}>
          {game.name}
        </div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {game.description.slice(0, 60)}…
        </div>
        <div className="mt-3 text-xs font-mono" style={{ color: game.color }}>
          Play →
        </div>
      </Link>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ background: `${game.color}0A`, borderColor: `${game.color}40` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-4xl mb-2">{game.icon}</div>
          <h3 className="text-xl font-bold">{game.name}</h3>
          <div className="text-xs font-mono mt-0.5" style={{ color: game.color }}>
            {game.id}
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-mono"
          style={{
            background: `${game.color}20`,
            color: game.color,
          }}
        >
          {game.status}
        </span>
      </div>

      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {game.description}
      </p>

      <div className="mb-4">
        <div className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>
          Allowed Item Classes
        </div>
        <div className="flex flex-wrap gap-1">
          {game.allowed_item_classes.map((cls) => (
            <span
              key={cls}
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}
            >
              {cls}
            </span>
          ))}
        </div>
      </div>

      <Link
        href={`/games/${game.id}`}
        className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: game.color, color: "#090A12" }}
      >
        Enter {game.name}
      </Link>
    </div>
  );
}
