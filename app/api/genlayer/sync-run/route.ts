import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain VoidRun into Supabase.
 * Body: { run_id, passport_id, tx_hash?, action? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { run_id, passport_id, tx_hash, action } = body;
    if (!run_id) return NextResponse.json({ error: "run_id required" }, { status: 400 });

    const raw = await readContract("VOID_RUN", "get_run", [run_id]);
    const run = parseContractResult<Record<string, unknown>>(raw);
    if (!run || (run as { error?: string }).error) {
      return NextResponse.json({ error: "Run not found on GenLayer", detail: run }, { status: 404 });
    }

    const db = createAdminClient();

    const { data, error } = await db.from("void_runs").upsert({
      id: run_id,
      passport_id: passport_id ?? String(run.passport_id ?? ""),
      loadout: Array.isArray(run.loadout) ? run.loadout : [],
      status: String(run.status ?? "active"),
      current_room: Number(run.current_room ?? 0),
      rooms: run.rooms ?? [],
      score: Number(run.score ?? 0),
      reward_item_id: (run.reward_item_id as string | null) ?? null,
      genlayer_tx_id: tx_hash ?? null,
      finished_at: (run.finished_at as string | null) ?? null,
    }, { onConflict: "id" }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (passport_id) {
      await db.from("transactions").insert({
        passport_id,
        contract: "VoidRun",
        action: action ?? "sync",
        request_payload: { run_id, action },
        response_payload: { ok: true, run },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ run: data, onchain: run });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-run]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
