import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await req.json();
  const { item_id } = body;

  const db = createAdminClient();
  const { data: run } = await db.from("void_runs").select("*").eq("id", runId).single();
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const newScore = (run.score ?? 0) + 20;
  await db.from("void_runs").update({ score: newScore }).eq("id", runId);

  return NextResponse.json({ ok: true, item_id, score_bonus: 20, new_score: newScore });
}
