import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain passport into the Supabase cache.
 *
 * Body: { passport_id, wallet, avatar_url?, tx_hash? }
 *
 * The frontend calls this AFTER successfully writing create_passport to the
 * PassportRegistry contract. We read the canonical state back from GenLayer
 * (truth) and upsert it into Supabase (cache).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passport_id, wallet, avatar_url, tx_hash } = body;

    if (!passport_id || !wallet) {
      return NextResponse.json(
        { error: "passport_id and wallet are required" },
        { status: 400 }
      );
    }

    // Read canonical passport state from GenLayer
    const raw = await readContract("PASSPORT_REGISTRY", "get_passport", [passport_id]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);

    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json(
        { error: "Passport not found on GenLayer", detail: onchain },
        { status: 404 }
      );
    }

    const db = createAdminClient();
    const now = new Date().toISOString();

    const row = {
      id: passport_id,
      owner: String(wallet).toLowerCase(),
      username: String(onchain.username ?? ""),
      avatar_url: avatar_url ?? null,
      metadata_uri: (onchain.metadata_uri as string) ?? null,
      ecosystem_xp: Number(onchain.ecosystem_xp ?? 0),
      level: Number(onchain.level ?? 1),
      reputation: Number(onchain.reputation ?? 100),
      genlayer_synced_at: now,
    };

    const { data, error } = await db
      .from("passports")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await db.from("activity_feed").insert({
      passport_id,
      game_id: "ecosystem",
      type: "passport_created",
      title: "Passport Created",
      description: `${row.username} joined the PixelPassport ecosystem`,
      metadata: { passport_id, wallet, tx_hash },
    });

    await db.from("transactions").insert({
      passport_id,
      contract: "PassportRegistry",
      action: "create_passport",
      request_payload: { passport_id, username: row.username },
      response_payload: { ok: true, passport_id, onchain },
      tx_id: tx_hash ?? null,
      status: "confirmed",
    });

    return NextResponse.json({ passport: data, onchain }, { status: 201 });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Sync failed";
    console.error("[POST /api/genlayer/sync-passport]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
