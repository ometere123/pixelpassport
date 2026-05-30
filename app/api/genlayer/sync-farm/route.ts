import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain ChainFarm into Supabase.
 * Body: { farm_id, passport_id, tx_hash?, action? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farm_id, passport_id, tx_hash, action } = body;
    if (!farm_id) return NextResponse.json({ error: "farm_id required" }, { status: 400 });

    const farmRaw = await readContract("CHAIN_FARM", "get_farm", [farm_id]);
    const farm = parseContractResult<Record<string, unknown>>(farmRaw);
    if (!farm || (farm as { error?: string }).error) {
      return NextResponse.json({ error: "Farm not found on GenLayer", detail: farm }, { status: 404 });
    }

    const plotsRaw = await readContract("CHAIN_FARM", "get_farm_plots", [farm_id]);
    const plots = parseContractResult<Record<string, unknown>[]>(plotsRaw) ?? [];

    const db = createAdminClient();

    await db.from("chain_farms").upsert({
      id: farm_id,
      passport_id: passport_id ?? String(farm.passport_id ?? ""),
      name: String(farm.name ?? "My Farm"),
      level: Number(farm.level ?? 1),
      xp: Number(farm.xp ?? 0),
      resources: farm.resources ?? {},
      genlayer_tx_id: tx_hash ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    // Mirror plots
    if (Array.isArray(plots) && plots.length > 0) {
      for (const p of plots) {
        await db.from("farm_plots").upsert({
          farm_id,
          plot_index: Number(p.index ?? 0),
          status: String(p.status ?? "empty"),
          crop: (p.crop as string | null) ?? null,
          planted_at: (p.planted_at as string | null) ?? null,
          ready_at: (p.ready_at as string | null) ?? null,
          applied_item_id: (p.applied_item_id as string | null) ?? null,
          yield_modifier: Number(p.yield_modifier ?? 1.0),
        }, { onConflict: "farm_id,plot_index" });
      }
    }

    if (passport_id) {
      await db.from("transactions").insert({
        passport_id,
        contract: "ChainFarm",
        action: action ?? "sync",
        request_payload: { farm_id, action },
        response_payload: { ok: true, farm },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ farm, plots });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-farm]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
