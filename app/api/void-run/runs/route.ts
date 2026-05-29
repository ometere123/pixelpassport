import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { run_id, passport_id, loadout } = body;

  if (!run_id || !passport_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = createAdminClient();
  const run = {
    id: run_id,
    passport_id,
    loadout: loadout ?? [],
    status: "active",
    current_room: 0,
    total_rooms: 5,
    rooms: [],
    score: 0,
    reward_item_id: null,
  };

  const { data, error } = await db.from("void_runs").insert(run).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run: data }, { status: 201 });
}
