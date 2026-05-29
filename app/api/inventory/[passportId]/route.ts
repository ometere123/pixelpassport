import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ passportId: string }> }) {
  const { passportId } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("items").select("*").eq("owner_passport_id", passportId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
