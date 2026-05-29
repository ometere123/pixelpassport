import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_YIELDS: Record<string, number> = {
  ember_grain: 10, moonroot: 15, chain_corn: 8, void_mushroom: 20, rune_pepper: 6,
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const body = await req.json();
  const { plot_id } = body;

  const plotIndex = parseInt(plot_id.replace("plot_", ""), 10);
  const db = createAdminClient();

  const { data: plot } = await db.from("farm_plots").select("*").eq("farm_id", farmId).eq("plot_index", plotIndex).single();
  if (!plot || plot.status === "empty") return NextResponse.json({ error: "Nothing to harvest" }, { status: 400 });

  const cropKey = plot.crop ?? "chain_corn";
  const base = BASE_YIELDS[cropKey] ?? 5;
  const yieldMod = plot.yield_modifier ?? 1.0;
  const actual = Math.round(base * yieldMod);

  // Reset plot
  await db.from("farm_plots").update({ status: "empty", crop: null, planted_at: null, ready_at: null, applied_item_id: null, yield_modifier: 1.0 }).eq("farm_id", farmId).eq("plot_index", plotIndex);

  // Update farm resources and XP
  const { data: farm } = await db.from("chain_farms").select("*").eq("id", farmId).single();
  if (farm) {
    const resources = (farm.resources as Record<string, number>) ?? {};
    resources[cropKey] = (resources[cropKey] ?? 0) + actual;
    const newXp = (farm.xp ?? 0) + actual * 5;
    const newLevel = Math.max(1, Math.floor(newXp / 300) + 1);
    await db.from("chain_farms").update({ resources, xp: newXp, level: newLevel }).eq("id", farmId);
  }

  const [farmRes, plotsRes] = await Promise.all([
    db.from("chain_farms").select("*").eq("id", farmId).single(),
    db.from("farm_plots").select("*").eq("farm_id", farmId).order("plot_index"),
  ]);
  const farmPlots = (plotsRes.data ?? []).map((p) => ({ ...p, id: `plot_${p.plot_index}`, index: p.plot_index }));

  return NextResponse.json({
    farm: { ...farmRes.data, plots: farmPlots },
    harvest: { crop: cropKey, yield: actual, yield_modifier: yieldMod },
  });
}
