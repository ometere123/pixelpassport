import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain item translation into Supabase.
 *
 * The translation itself is an LLM call inside ItemRegistry.translate_item
 * (via gl.eq_principle.prompt_non_comparative) — this route just reads
 * the canonical translation back and caches it.
 *
 * Body: { item_id, target_game, passport_id?, tx_hash? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, target_game, passport_id, tx_hash } = body;
    if (!item_id || !target_game) {
      return NextResponse.json({ error: "item_id and target_game required" }, { status: 400 });
    }

    const raw = await readContract("ITEM_REGISTRY", "get_item_translation", [item_id, target_game]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);
    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json({ error: "Translation not found on GenLayer", detail: onchain }, { status: 404 });
    }

    const db = createAdminClient();

    // Look up source item for origin_game
    const { data: srcItem } = await db.from("items").select("origin_game, name").eq("id", item_id).single();

    const row = {
      item_id,
      source_game: srcItem?.origin_game ?? "unknown",
      target_game,
      translated_name: String(onchain.translated_name ?? ""),
      translated_class: String(onchain.translated_class ?? "relic"),
      translated_power_level: Number(onchain.translated_power_level ?? 1),
      abilities: Array.isArray(onchain.abilities) ? onchain.abilities : [],
      visual_direction: String(onchain.visual_direction ?? ""),
      reasoning: String(onchain.reasoning ?? ""),
      balance_notes: String(onchain.balance_notes ?? ""),
      source_traits_used: Array.isArray(onchain.source_traits_used) ? onchain.source_traits_used : [],
      genlayer_tx_id: tx_hash ?? null,
    };

    const { data, error } = await db
      .from("item_translations")
      .upsert(row, { onConflict: "item_id,target_game" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db.from("items").update({ is_translated: true }).eq("id", item_id);

    if (passport_id) {
      await db.from("activity_feed").insert({
        passport_id,
        game_id: target_game,
        type: "item_translated",
        title: `${srcItem?.name ?? "Item"} translated to ${target_game}`,
        description: `Became ${row.translated_name} via GenLayer LLM`,
        metadata: { item_id, target_game, translated_name: row.translated_name, tx_hash },
      });

      await db.from("transactions").insert({
        passport_id,
        contract: "ItemRegistry",
        action: "translate_item",
        request_payload: { item_id, target_game },
        response_payload: { ok: true, translation: onchain },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ translation: data, onchain }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-translation]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
