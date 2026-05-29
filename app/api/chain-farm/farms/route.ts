import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { farm_id, passport_id } = body;

  if (!farm_id || !passport_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = createAdminClient();

  const farm = {
    id: farm_id,
    passport_id,
    name: `${passport_id.slice(0, 8)}'s Farm`,
    level: 1,
    xp: 0,
    resources: { ember_grain: 0, moonroot: 0, chain_corn: 0, void_mushroom: 0, rune_pepper: 0 },
  };

  const { data: farmData, error: farmErr } = await db.from("chain_farms").insert(farm).select().single();
  if (farmErr) return NextResponse.json({ error: farmErr.message }, { status: 500 });

  // Create 4 plots
  const plots = Array.from({ length: 4 }, (_, i) => ({
    farm_id,
    plot_index: i,
    status: "empty",
    crop: null,
    planted_at: null,
    ready_at: null,
    applied_item_id: null,
    yield_modifier: 1.0,
  }));

  const { data: plotsData } = await db.from("farm_plots").insert(plots).select();

  const farmWithPlots = {
    ...farmData,
    plots: (plotsData ?? []).map((p) => ({ ...p, id: `plot_${p.plot_index}`, index: p.plot_index })),
  };

  return NextResponse.json({ farm: farmWithPlots }, { status: 201 });
}
