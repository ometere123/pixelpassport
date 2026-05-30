import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain RuneArena battle into Supabase.
 * Body: { battle_id, passport_id, tx_hash?, action? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { battle_id, passport_id, tx_hash, action } = body;
    if (!battle_id) return NextResponse.json({ error: "battle_id required" }, { status: 400 });

    const raw = await readContract("RUNE_ARENA", "get_battle", [battle_id]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);
    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json({ error: "Battle not found on GenLayer", detail: onchain }, { status: 404 });
    }

    const db = createAdminClient();
    const row = {
      id: battle_id,
      passport_id: passport_id ?? String(onchain.passport_id ?? ""),
      loadout: Array.isArray(onchain.loadout) ? onchain.loadout : [],
      status: String(onchain.status ?? "active"),
      turns: onchain.turns ?? [],
      winner: (onchain.winner as string | null) ?? null,
      reward_item_id: (onchain.reward_item_id as string | null) ?? null,
      xp_earned: Number(onchain.xp_earned ?? 0),
      narration: Array.isArray(onchain.narration) ? onchain.narration : [],
      genlayer_tx_id: tx_hash ?? null,
      finished_at: (onchain.finished_at as string | null) ?? null,
    };

    const { data, error } = await db.from("rune_battles").upsert(row, { onConflict: "id" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (passport_id) {
      await db.from("transactions").insert({
        passport_id,
        contract: "RuneArena",
        action: action ?? "submit_action",
        request_payload: { battle_id, action },
        response_payload: { ok: true, onchain },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ battle: data, onchain });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-battle]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
