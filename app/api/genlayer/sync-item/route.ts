import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain item into Supabase after create_item or after a battle reward mint.
 * Body: { item_id, passport_id, origin_game, tx_hash? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, passport_id, origin_game, tx_hash } = body;
    if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

    const raw = await readContract("ITEM_REGISTRY", "get_item", [item_id]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);
    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json({ error: "Item not found on GenLayer", detail: onchain }, { status: 404 });
    }

    const db = createAdminClient();
    const row = {
      id: item_id,
      name: String(onchain.name ?? ""),
      class: String(onchain.class ?? "relic"),
      rarity: String(onchain.rarity ?? "common"),
      power_level: Number(onchain.power_level ?? 1),
      traits: Array.isArray(onchain.traits) ? onchain.traits : [],
      lore: String(onchain.lore ?? ""),
      origin_game: origin_game ?? String(onchain.origin_game ?? ""),
      owner_passport_id: passport_id ?? String(onchain.owner_passport_id ?? ""),
      metadata_uri: (onchain.metadata_uri as string) ?? null,
      is_translated: false,
      genlayer_synced_at: new Date().toISOString(),
    };

    const { data, error } = await db.from("items").upsert(row, { onConflict: "id" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (passport_id) {
      await db.from("activity_feed").insert({
        passport_id,
        game_id: row.origin_game,
        type: "item_earned",
        title: "Item Earned",
        description: `Earned ${row.name} (${row.rarity})`,
        metadata: { item_id, tx_hash },
      });

      await db.from("transactions").insert({
        passport_id,
        contract: "ItemRegistry",
        action: "create_item",
        request_payload: { item_id, origin_game: row.origin_game },
        response_payload: { ok: true, item_id, onchain },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ item: data, onchain }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-item]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
