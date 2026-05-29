import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { passport_id } = body;
  if (!passport_id) return NextResponse.json({ error: "passport_id required" }, { status: 400 });

  const db = createAdminClient();
  // In production: call GenLayer PassportRegistry.get_passport and update Supabase cache
  // For MVP: mark sync timestamp
  const { data } = await db.from("passports").update({ genlayer_synced_at: new Date().toISOString() }).eq("id", passport_id).select().single();
  return NextResponse.json({ ok: true, synced_at: new Date().toISOString(), passport: data });
}
