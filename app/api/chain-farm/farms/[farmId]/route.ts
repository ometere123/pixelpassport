import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const db = createAdminClient();
  const [farmRes, plotsRes] = await Promise.all([
    db.from("chain_farms").select("*").eq("id", farmId).single(),
    db.from("farm_plots").select("*").eq("farm_id", farmId).order("plot_index"),
  ]);
  if (farmRes.error || !farmRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const plots = (plotsRes.data ?? []).map((p) => ({ ...p, id: `plot_${p.plot_index}`, index: p.plot_index }));
  return NextResponse.json({ farm: { ...farmRes.data, plots } });
}
