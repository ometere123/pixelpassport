import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("rune_battles").select("*").eq("id", battleId).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ battle: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const body = await req.json();
  const db = createAdminClient();

  const { data: battle, error: fetchErr } = await db.from("rune_battles").select("*").eq("id", battleId).single();
  if (fetchErr || !battle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "start") {
    const narration = `The arena trembles. ${(battle.opponent as Record<string, unknown>)?.name} enters the field. Your loadout: ${battle.loadout?.join(", ")}. Let the runes decide your fate.`;
    const updated = {
      status: "active",
      narration: [...(battle.narration ?? []), narration],
    };
    const { data, error } = await db.from("rune_battles").update(updated).eq("id", battleId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ battle: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
