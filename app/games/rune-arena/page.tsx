import Link from "next/link";
import { getGame } from "@/lib/games/registry";

export default function RuneArenaPage() {
  const game = getGame("rune-arena")!;
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="rounded-2xl p-8 mb-6 border relative overflow-hidden"
        style={{ background: "rgba(249,115,115,0.08)", borderColor: "rgba(249,115,115,0.3)" }}>
        <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none">⚔️</div>
        <div className="relative z-10">
          <div className="text-xs font-mono mb-2" style={{ color: game.color }}>RUNE ARENA</div>
          <h1 className="text-3xl font-bold mb-2">Enter the Arena</h1>
          <p className="text-sm max-w-lg" style={{ color: "var(--text-muted)" }}>
            Forge your loadout from runes and relics. Each battle is adjudicated by GenLayer AI,
            ensuring dynamic and fair combat. Win to earn legendary weapons and combat relics.
          </p>
        </div>
      </div>

      {/* Battle actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/games/rune-arena/battle/new"
          className="block rounded-xl p-6 border text-center transition-all hover:scale-[1.01]"
          style={{ background: "rgba(249,115,115,0.1)", borderColor: "rgba(249,115,115,0.4)" }}>
          <div className="text-3xl mb-3">⚔️</div>
          <div className="font-bold mb-1">New Battle</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Select your loadout and enter a new battle.
          </div>
        </Link>
        <Link href="/inventory?game=rune-arena"
          className="block rounded-xl p-6 border text-center transition-all hover:scale-[1.01]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">📦</div>
          <div className="font-bold mb-1">Your Arena Items</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            View weapons, armor, and combat relics.
          </div>
        </Link>
      </div>

      {/* Balance rules */}
      <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-4">Arena Balance Rules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(game.balance_rules).map(([key, val]) => (
            <div key={key} className="p-3 rounded-lg" style={{ background: "var(--surface-soft)" }}>
              <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {key.replace(/_/g, " ")}
              </div>
              <div className="font-bold text-sm mt-1" style={{ color: game.color }}>
                {String(val)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg text-xs font-mono"
          style={{ background: "rgba(249,115,115,0.06)", color: "var(--text-muted)" }}>
          ⬡ GenLayer enforces these rules when adjudicating battle turns.
        </div>
      </div>
    </div>
  );
}
