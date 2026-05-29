"use client";
import { useState, useEffect, Suspense } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import type { CanonicalItem, TranslationResult } from "@/types";
import { GAMES } from "@/lib/games/registry";
import { gameColor, gameLabel } from "@/lib/utils/cn";

function TranslateForm() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CanonicalItem | null>(null);
  const [targetGame, setTargetGame] = useState<string>("");
  const [translating, setTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);

  const preselectedItemId = searchParams.get("item");
  const preselectedTarget = searchParams.get("target");

  useEffect(() => {
    if (!isConnected || !address) return;
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d?.id) {
          setPassportId(d.id);
          const inv = await fetch(`/api/inventory/${d.id}`).then((r) => r.json());
          const allItems: CanonicalItem[] = inv?.items ?? [];
          setItems(allItems);
          if (preselectedItemId) {
            const pre = allItems.find((i) => i.id === preselectedItemId);
            if (pre) setSelectedItem(pre);
          }
        }
      })
      .catch(() => {});
    if (preselectedTarget) setTargetGame(preselectedTarget);
  }, [address, isConnected, preselectedItemId, preselectedTarget]);

  async function translate() {
    if (!selectedItem || !targetGame || !passportId) return;
    setTranslating(true);
    setResult(null);
    const res = await fetch(`/api/items/${selectedItem.id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_game: targetGame, passport_id: passportId }),
    });
    const d = await res.json();
    if (d.translation) setResult(d.translation as TranslationResult);
    setTranslating(false);
  }

  const availableTargets = GAMES.filter((g) => g.id !== selectedItem?.origin_game);

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔄</div>
        <p style={{ color: "var(--text-muted)" }}>Connect your wallet to translate items.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-8 border mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-6">Item Translation</h2>

        {/* Select item */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Select Item</label>
          {items.length === 0 ? (
            <div className="p-4 rounded-lg text-sm text-center" style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
              No items yet. Earn items by playing RuneArena or VoidRun.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <button key={item.id} onClick={() => { setSelectedItem(item); setResult(null); }}
                  className="p-3 rounded-xl border text-left transition-all hover:opacity-80"
                  style={{
                    background: selectedItem?.id === item.id ? "rgba(56,217,248,0.1)" : "var(--surface-soft)",
                    borderColor: selectedItem?.id === item.id ? "rgba(56,217,248,0.4)" : "var(--border)",
                  }}>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.class} · PL {item.power_level}
                  </div>
                  <div className="text-xs" style={{ color: gameColor(item.origin_game) }}>
                    from {gameLabel(item.origin_game)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Select target game */}
        {selectedItem && (
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Target World</label>
            <div className="grid grid-cols-3 gap-2">
              {availableTargets.map((game) => (
                <button key={game.id} onClick={() => { setTargetGame(game.id); setResult(null); }}
                  className="p-3 rounded-xl border text-center transition-all hover:opacity-80"
                  style={{
                    background: targetGame === game.id ? `${game.color}15` : "var(--surface-soft)",
                    borderColor: targetGame === game.id ? `${game.color}60` : "var(--border)",
                  }}>
                  <div className="text-xl mb-1">{game.icon}</div>
                  <div className="text-xs font-semibold" style={{ color: targetGame === game.id ? game.color : "var(--text-muted)" }}>
                    {game.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={translate} disabled={!selectedItem || !targetGame || translating}
          className="w-full py-3 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--pixel-cyan)", color: "#090A12" }}>
          {translating ? "GenLayer translating…" : "Translate with GenLayer"}
        </button>

        {translating && (
          <div className="mt-4 p-4 rounded-xl text-sm text-center shimmer"
            style={{ background: "rgba(56,217,248,0.05)", color: "var(--pixel-cyan)" }}>
            ⬡ GenLayer is reasoning about cross-world adaptation…
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "rgba(56,217,248,0.3)" }}>
          <div className="text-xs font-mono mb-4" style={{ color: "var(--pixel-cyan)" }}>
            ⬡ GENLAYER TRANSLATION RESULT
          </div>

          <h3 className="text-2xl font-bold mb-1">{result.translated_name}</h3>
          <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {result.translated_class} · Power Level {result.translated_power_level}
          </div>

          {result.abilities.length > 0 && (
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Abilities</div>
              {result.abilities.map((ab, i) => (
                <div key={i} className="text-sm px-3 py-1.5 rounded mb-1"
                  style={{ background: "var(--surface-soft)" }}>
                  · {ab}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl mb-3"
            style={{ background: "rgba(56,217,248,0.06)", borderLeft: "3px solid var(--pixel-cyan)" }}>
            <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>GenLayer Reasoning</div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{result.reasoning}</p>
          </div>

          {result.balance_notes && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Balance: {result.balance_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TranslatePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Translate Item</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Select an item and a target world. GenLayer reads the item&apos;s traits, origin, and
          the target game&apos;s balance rules, then reasons about how it should manifest.
        </p>
      </div>
      <Suspense fallback={<div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</div>}>
        <TranslateForm />
      </Suspense>
    </div>
  );
}
