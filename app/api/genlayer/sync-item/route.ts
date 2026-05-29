import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { item_id } = body;
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const db = createAdminClient();
  const { data } = await db.from("items").update({ genlayer_synced_at: new Date().toISOString() }).eq("id", item_id).select().single();
  return NextResponse.json({ ok: true, item: data });
}
