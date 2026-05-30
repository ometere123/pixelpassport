import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror a passport's mutable state (XP, level, reputation, achievements)
 * from PassportRegistry into Supabase after award_xp / award_achievement /
 * update_reputation.
 *
 * Body: { passport_id, tx_hash?, action?, payload? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passport_id, tx_hash, action, payload } = body;
    if (!passport_id) return NextResponse.json({ error: "passport_id required" }, { status: 400 });

    const raw = await readContract("PASSPORT_REGISTRY", "get_passport", [passport_id]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);
    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json({ error: "Passport not found on GenLayer", detail: onchain }, { status: 404 });
    }

    const db = createAdminClient();

    const { data, error } = await db
      .from("passports")
      .update({
        ecosystem_xp: Number(onchain.ecosystem_xp ?? 0),
        level: Number(onchain.level ?? 1),
        reputation: Number(onchain.reputation ?? 100),
        genlayer_synced_at: new Date().toISOString(),
      })
      .eq("id", passport_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Per-game progress mirror
    const games = (onchain.games ?? {}) as Record<string, Record<string, unknown>>;
    for (const [gameId, g] of Object.entries(games)) {
      await db.from("passport_game_progress").upsert(
        {
          passport_id,
          game_id: gameId,
          xp: Number(g.xp ?? 0),
          level: Number(g.level ?? 1),
          wins: Number(g.wins ?? 0),
          losses: Number(g.losses ?? 0),
          items_earned: Number(g.items_earned ?? 0),
          last_played: (g.last_played as string | null) ?? null,
        },
        { onConflict: "passport_id,game_id" }
      );
    }

    // Achievements mirror
    const achievements = Array.isArray(onchain.achievements) ? onchain.achievements : [];
    for (const a of achievements as Record<string, unknown>[]) {
      const name = String(a.name ?? "");
      if (!name) continue;
      const { data: existing } = await db
        .from("achievements")
        .select("id")
        .eq("passport_id", passport_id)
        .eq("name", name)
        .eq("game_id", String(a.game_id ?? "ecosystem"))
        .maybeSingle();
      if (!existing) {
        await db.from("achievements").insert({
          passport_id,
          game_id: String(a.game_id ?? "ecosystem"),
          name,
          description: String(a.description ?? ""),
          icon: String(a.icon ?? "🏆"),
          rarity: String(a.rarity ?? "common"),
        });
      }
    }

    // Activity + tx record
    if (action === "award_xp" && payload) {
      await db.from("activity_feed").insert({
        passport_id,
        game_id: String(payload.game_id ?? "ecosystem"),
        type: "xp_gained",
        title: "XP Awarded",
        description: `+${payload.xp} XP — ${payload.reason ?? "no reason given"}`,
        metadata: { tx_hash, ...payload },
      });
    }
    if (action === "award_achievement" && payload) {
      const ach = (payload as { achievement?: Record<string, unknown> }).achievement ?? {};
      await db.from("activity_feed").insert({
        passport_id,
        game_id: String(payload.game_id ?? "ecosystem"),
        type: "achievement_unlocked",
        title: "Achievement Unlocked",
        description: String(ach.name ?? "Achievement"),
        metadata: { tx_hash, ...payload },
      });
    }

    await db.from("transactions").insert({
      passport_id,
      contract: "PassportRegistry",
      action: action ?? "sync",
      request_payload: payload ?? {},
      response_payload: { ok: true, onchain },
      tx_id: tx_hash ?? null,
      status: "confirmed",
    });

    return NextResponse.json({ passport: data, onchain });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-passport-state]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
