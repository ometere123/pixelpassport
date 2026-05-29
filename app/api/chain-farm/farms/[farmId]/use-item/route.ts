import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const body = await req.json();
  const { item_id, item } = body;

  const db = createAdminClient();

  // Determine yield modifier based on item traits
  const traits: string[] = item?.traits ?? item?.source_traits_used ?? [];
  const hasFire = traits.some((t: string) => t.includes("fire") || t.includes("ember") || t.includes("heat"));
  const yieldMod = hasFire ? 1.5 : 1.2;

  // Apply to all planted fire-compatible crops
  const { data: plots } = await db.from("farm_plots").select("*").eq("farm_id", farmId);
  for (const plot of plots ?? []) {
    if (plot.status === "planted" && (hasFire ? ["ember_grain", "rune_pepper"].includes(plot.crop) : ["chain_corn", "moonroot"].includes(plot.crop))) {
      await db.from("farm_plots").update({ yield_modifier: yieldMod, applied_item_id: item_id }).eq("id", plot.id);
    }
  }

  const [farmRes, plotsRes] = await Promise.all([
    db.from("chain_farms").select("*").eq("id", farmId).single(),
    db.from("farm_plots").select("*").eq("farm_id", farmId).order("plot_index"),
  ]);
  const farmPlots = (plotsRes.data ?? []).map((p) => ({ ...p, id: `plot_${p.plot_index}`, index: p.plot_index }));
  return NextResponse.json({ farm: { ...farmRes.data, plots: farmPlots }, yield_modifier: yieldMod });
}
