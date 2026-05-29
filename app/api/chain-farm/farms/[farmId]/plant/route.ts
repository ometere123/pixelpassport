import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CROP_GROW_TIMES: Record<string, number> = {
  ember_grain: 120,
  moonroot: 240,
  chain_corn: 90,
  void_mushroom: 300,
  rune_pepper: 60,
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const body = await req.json();
  const { plot_id, crop } = body;

  const cropKey = crop.toLowerCase().replace(/ /g, "_");
  if (!CROP_GROW_TIMES[cropKey]) return NextResponse.json({ error: "Unknown crop" }, { status: 400 });

  const db = createAdminClient();
  const plotIndex = parseInt(plot_id.replace("plot_", ""), 10);

  const now = new Date();
  const readyAt = new Date(now.getTime() + CROP_GROW_TIMES[cropKey] * 1000);

  await db.from("farm_plots").update({
    status: "planted",
    crop: cropKey,
    planted_at: now.toISOString(),
    ready_at: readyAt.toISOString(),
  }).eq("farm_id", farmId).eq("plot_index", plotIndex);

  // Return updated farm
  const [farmRes, plotsRes] = await Promise.all([
    db.from("chain_farms").select("*").eq("id", farmId).single(),
    db.from("farm_plots").select("*").eq("farm_id", farmId).order("plot_index"),
  ]);

  const plots = (plotsRes.data ?? []).map((p) => ({ ...p, id: `plot_${p.plot_index}`, index: p.plot_index }));
  return NextResponse.json({ farm: { ...farmRes.data, plots } });
}
