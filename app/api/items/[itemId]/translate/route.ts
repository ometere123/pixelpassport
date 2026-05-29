import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTranslationContext, parseMockTranslation } from "@/lib/genlayer/client";
import type { CanonicalItem } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await req.json();
  const { target_game, passport_id } = body;

  if (!target_game) return NextResponse.json({ error: "target_game required" }, { status: 400 });

  const db = createAdminClient();

  // Get item
  const { data: item, error: itemErr } = await db.from("items").select("*").eq("id", itemId).single();
  if (itemErr || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const canonicalItem = item as CanonicalItem;

  // Check if translation already exists
  const { data: existing } = await db.from("item_translations").select("*").eq("item_id", itemId).eq("target_game", target_game).single();
  if (existing) {
    return NextResponse.json({ translation: existing, cached: true });
  }

  // Build context and run translation (mock GenLayer for MVP)
  const context = buildTranslationContext(target_game);
  const translationResult = parseMockTranslation(canonicalItem.name, canonicalItem.class, target_game);

  // Store translation
  const { data: trans, error: transErr } = await db.from("item_translations").insert({
    item_id: itemId,
    source_game: canonicalItem.origin_game,
    target_game,
    translated_name: translationResult.translated_name,
    translated_class: translationResult.translated_class,
    translated_power_level: translationResult.translated_power_level,
    abilities: translationResult.abilities,
    visual_direction: translationResult.visual_direction,
    reasoning: translationResult.reasoning,
    balance_notes: translationResult.balance_notes,
    source_traits_used: translationResult.source_traits_used,
  }).select().single();

  if (transErr) return NextResponse.json({ error: transErr.message }, { status: 500 });

  // Mark item as translated
  await db.from("items").update({ is_translated: true }).eq("id", itemId);

  // Record activity
  if (passport_id) {
    await db.from("activity_feed").insert({
      passport_id,
      game_id: target_game,
      type: "item_translated",
      title: `${canonicalItem.name} translated to ${target_game}`,
      description: `Became ${translationResult.translated_name} via GenLayer`,
      metadata: { item_id: itemId, target_game, translated_name: translationResult.translated_name },
    });
  }

  // Record tx
  await db.from("transactions").insert({
    passport_id: passport_id ?? null,
    contract: "ItemRegistry",
    action: "translate_item",
    request_payload: { item_id: itemId, target_game, context },
    response_payload: { ok: true, translation: translationResult },
    status: "confirmed",
  });

  return NextResponse.json({ translation: trans });
}
