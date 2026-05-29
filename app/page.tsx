import Link from "next/link";
import { GAMES } from "@/lib/games/registry";

export default function LandingPage() {
  return (
    <div className="pixel-grid min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(246,200,95,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-6 border"
            style={{
              borderColor: "rgba(56,217,248,0.3)",
              color: "var(--pixel-cyan)",
              background: "rgba(56,217,248,0.08)",
            }}
          >
            GenLayer Protocol · Cross-Game Identity · Item Translation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="gradient-gold">Pixel</span>
            <span className="gradient-cyan">Passport</span>
          </h1>

          <p className="text-2xl md:text-3xl font-mono mb-3" style={{ color: "var(--text-muted)" }}>
            One passport.{" "}
            <span style={{ color: "var(--text-main)" }}>Many worlds.</span>
          </p>

          <p
            className="text-base md:text-lg max-w-2xl mx-auto mb-10"
            style={{ color: "var(--text-muted)", lineHeight: 1.7 }}
          >
            PixelPassport is not one game. It is a{" "}
            <span style={{ color: "var(--passport-gold)" }}>GenLayer-powered protocol</span>{" "}
            for cross-game identity and item translation. One persistent passport.
            Items that travel — and <em>transform</em> — across worlds.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/passport/create"
              className="px-6 py-3 rounded-lg font-semibold text-base transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--passport-gold), #FFD580)",
                color: "#090A12",
              }}
            >
              Create Passport
            </Link>
            <Link
              href="/games"
              className="px-6 py-3 rounded-lg font-semibold text-base border transition-all hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-main)", background: "var(--surface)" }}
            >
              View Games
            </Link>
            <Link
              href="/inventory"
              className="px-6 py-3 rounded-lg font-semibold text-base border transition-all hover:opacity-80"
              style={{ borderColor: "rgba(56,217,248,0.3)", color: "var(--pixel-cyan)", background: "rgba(56,217,248,0.06)" }}
            >
              View Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* Item Translation Example */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="rounded-2xl p-8 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-mono font-bold mb-2" style={{ color: "var(--passport-gold)" }}>
            The Protocol Moment
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Items do not just transfer between games — GenLayer re-contextualises them.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
            <div className="flex-1 rounded-xl p-5 border text-center"
              style={{ background: "rgba(249,115,115,0.08)", borderColor: "rgba(249,115,115,0.3)" }}>
              <div className="text-3xl mb-2">⚔️</div>
              <div className="text-xs font-mono mb-1" style={{ color: "#F97373" }}>RuneArena</div>
              <div className="font-bold text-lg">Ember Blade</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                weapon · fire_affinity · cutting_edge
              </div>
            </div>

            <div className="px-4 text-center">
              <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>GenLayer</div>
              <div className="text-xl" style={{ color: "var(--pixel-cyan)" }}>→</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>translates</div>
            </div>

            <div className="flex-1 rounded-xl p-5 border text-center"
              style={{ background: "rgba(101,212,110,0.08)", borderColor: "rgba(101,212,110,0.3)" }}>
              <div className="text-3xl mb-2">🌾</div>
              <div className="text-xs font-mono mb-1" style={{ color: "#65D46E" }}>ChainFarm</div>
              <div className="font-bold text-lg">Flame Plough</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                tool · heat_boost · fire_till
              </div>
            </div>

            <div className="px-4 text-center">
              <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>GenLayer</div>
              <div className="text-xl" style={{ color: "var(--pixel-cyan)" }}>→</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>translates</div>
            </div>

            <div className="flex-1 rounded-xl p-5 border text-center"
              style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}>
              <div className="text-3xl mb-2">🌀</div>
              <div className="text-xs font-mono mb-1" style={{ color: "#8B5CF6" }}>VoidRun</div>
              <div className="font-bold text-lg">Burning Dash Relic</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                relic · ember_surge · heat_memory
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg text-sm font-mono"
            style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--pixel-cyan)" }}>GenLayer reasoning: </span>
            The Ember Blade&apos;s fire-affinity and cutting power map naturally to an agricultural ploughing tool.
            In the void, its martial history becomes a charged memory artifact.
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-2">Three worlds. One passport.</h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Each game is a distinct world with its own rules, aesthetics, and economy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}
              className="block rounded-xl p-6 border transition-all hover:scale-[1.02]"
              style={{ background: `${game.color}0A`, borderColor: `${game.color}40` }}>
              <div className="text-3xl mb-3">{game.icon}</div>
              <div className="text-xs font-mono font-bold mb-1" style={{ color: game.color }}>{game.name}</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{game.description}</p>
              <div className="mt-4 text-xs font-mono" style={{ color: game.color }}>Enter world →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture callout */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="rounded-2xl p-8 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--pixel-cyan)" }}>Protocol Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: "var(--passport-gold)" }}>GenLayer = Source of Truth</div>
              <ul className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
                <li>· Passport identity &amp; ownership</li>
                <li>· Item canonical state</li>
                <li>· Cross-game item translation (AI)</li>
                <li>· Battle &amp; puzzle adjudication (AI)</li>
                <li>· Dispute resolution (AI)</li>
                <li>· Achievement grants</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: "var(--pixel-cyan)" }}>Supabase = Realtime UX Layer</div>
              <ul className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
                <li>· Profile cache &amp; avatars</li>
                <li>· Activity feed &amp; leaderboards</li>
                <li>· Game session indexing</li>
                <li>· Realtime notifications</li>
                <li>· Translation result cache</li>
                <li>· Media &amp; metadata storage</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg text-xs font-mono"
            style={{ background: "rgba(246,200,95,0.08)", color: "var(--passport-gold)" }}>
            If Supabase and GenLayer disagree — GenLayer wins.
          </div>
        </div>
      </section>
    </div>
  );
}
