import { createAdminClient } from "@/lib/supabase/admin";
import { GenLayerProofPanel } from "@/components/proof/GenLayerProofPanel";
import { ItemLineageTimeline } from "@/components/inventory/ItemLineageTimeline";
import { TranslationReasoningPanel } from "@/components/inventory/TranslationReasoningPanel";
import Link from "next/link";
import type { CanonicalItem, ItemTranslation } from "@/types";
import { rarityColor, gameColor, gameLabel } from "@/lib/utils/cn";
import { ItemViewer3D } from "@/components/3d/ItemViewer3D";
import { ItemTranslationMorph } from "@/components/3d/ItemTranslationMorph";

interface PageProps {
  params: Promise<{ itemId: string }>;
}

async function getItemData(itemId: string) {
  try {
    const db = createAdminClient();
    const [itemRes, translationsRes] = await Promise.all([
      db.from("items").select("*").eq("id", itemId).single(),
      db.from("item_translations").select("*").eq("item_id", itemId),
    ]);
    return {
      item: itemRes.data as CanonicalItem | null,
      translations: (translationsRes.data ?? []) as ItemTranslation[],
    };
  } catch {
    return { item: null, translations: [] };
  }
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { itemId } = await params;
  const { item, translations } = await getItemData(itemId);

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <h1 className="text-xl font-bold">Item Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-6 border"
            style={{ background: "var(--surface)", borderColor: `${gameColor(item.origin_game)}40` }}>
            <div className="mb-4">
              <ItemViewer3D item={item} height={220} />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">{item.name}</h1>
            <div className={`text-center text-sm mb-3 ${rarityColor(item.rarity)}`}>{item.rarity}</div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Class</span>
                <span>{item.class}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Power Level</span>
                <span style={{ color: "var(--xp-blue)" }}>{item.power_level}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Origin</span>
                <span style={{ color: gameColor(item.origin_game) }}>{gameLabel(item.origin_game)}</span>
              </div>
            </div>

            {item.traits.length > 0 && (
              <div className="mt-4">
                <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Traits</div>
                <div className="flex flex-wrap gap-1">
                  {item.traits.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-xs font-mono"
                      style={{ background: "var(--surface-soft)", color: "var(--pixel-cyan)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.lore && (
              <div className="mt-4 p-3 rounded-lg text-xs italic"
                style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
                {item.lore}
              </div>
            )}

            <Link href={`/translate?item=${item.id}`}
              className="block mt-4 w-full text-center py-2.5 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: "var(--pixel-cyan)", color: "#090A12" }}>
              Translate to Another World
            </Link>
          </div>

          <GenLayerProofPanel
            contract="ItemRegistry"
            action="get_item"
            recordId={item.id}
          />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D translation morph — protocol moment in physical form */}
          {translations.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-bold">Cross-World Forms</h2>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Click a tab to morph the model
                </span>
              </div>
              <ItemTranslationMorph item={item} translations={translations} />
            </div>
          )}

          {/* Translation history */}
          {translations.length > 0 && (
            <div>
              <h2 className="font-bold mb-4">Translation History</h2>
              <ItemLineageTimeline item={item} translations={translations} />
              <div className="mt-4 space-y-3">
                {translations.map((t) => (
                  <TranslationReasoningPanel key={t.id} translation={t} />
                ))}
              </div>
            </div>
          )}

          {translations.length === 0 && (
            <div className="rounded-xl p-8 border text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-bold mb-2">No translations yet</h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Translate this item to see how GenLayer re-contextualises it for other game worlds.
              </p>
              <Link href={`/translate?item=${item.id}`}
                className="px-4 py-2 rounded-lg text-sm font-semibold inline-block"
                style={{ background: "var(--pixel-cyan)", color: "#090A12" }}>
                Translate Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
