import Link from "next/link";
import { getGame } from "@/lib/games/registry";

export default function ChainFarmPage() {
  const game = getGame("chain-farm")!;
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="rounded-2xl p-8 mb-6 border relative overflow-hidden"
        style={{ background: "rgba(101,212,110,0.08)", borderColor: "rgba(101,212,110,0.3)" }}>
        <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none">🌾</div>
        <div className="relative z-10">
          <div className="text-xs font-mono mb-2" style={{ color: game.color }}>CHAIN FARM</div>
          <h1 className="text-3xl font-bold mb-2">Your Farm Awaits</h1>
          <p className="text-sm max-w-lg" style={{ color: "var(--text-muted)" }}>
            Plant mystical crops, use translated tools from other worlds, and let GenLayer evaluate
            your farming strategy. A battle sword becomes a plough here.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/games/chain-farm/farm/new"
          className="block rounded-xl p-6 border text-center transition-all hover:scale-[1.01]"
          style={{ background: "rgba(101,212,110,0.1)", borderColor: "rgba(101,212,110,0.4)" }}>
          <div className="text-3xl mb-3">🌱</div>
          <div className="font-bold mb-1">Create Farm</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Start a new farm plot.</div>
        </Link>
        <Link href="/translate?target=chain-farm"
          className="block rounded-xl p-6 border text-center transition-all hover:scale-[1.01]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🔄</div>
          <div className="font-bold mb-1">Translate Tools</div>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Bring items from other worlds to ChainFarm.
          </div>
        </Link>
      </div>

      {/* Crops reference */}
      <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-4">Available Crops</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: "Ember Grain", time: "120s", fire: true, yield: 10 },
            { name: "Moonroot", time: "240s", fire: false, yield: 15 },
            { name: "Chain Corn", time: "90s", fire: false, yield: 8 },
            { name: "Void Mushroom", time: "300s", fire: false, yield: 20 },
            { name: "Rune Pepper", time: "60s", fire: true, yield: 6 },
          ].map((crop) => (
            <div key={crop.name} className="p-3 rounded-lg" style={{ background: "var(--surface-soft)" }}>
              <div className="font-semibold text-sm">{crop.name}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Base yield: {crop.yield} · {crop.time}
              </div>
              {crop.fire && (
                <div className="text-xs mt-0.5" style={{ color: "#F97373" }}>
                  🔥 Fire-affinity boost
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
