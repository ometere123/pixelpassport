import { GAMES } from "@/lib/games/registry";
import { GameCard } from "@/components/games/GameCard";

export default function GamesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Game Worlds</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Three distinct worlds. One passport. Items earned in any world can be translated by GenLayer
          and used in others.
        </p>
      </div>

      {/* Translation reminder */}
      <div
        className="rounded-xl p-4 mb-8 border text-sm"
        style={{ background: "rgba(56,217,248,0.06)", borderColor: "rgba(56,217,248,0.2)" }}
      >
        <span style={{ color: "var(--pixel-cyan)" }}>⬡ Protocol note: </span>
        <span style={{ color: "var(--text-muted)" }}>
          Items are not just copied between games. GenLayer reads each item&apos;s traits, origin context,
          and the target game&apos;s rules, then reasons about how the item should manifest in the new world.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
