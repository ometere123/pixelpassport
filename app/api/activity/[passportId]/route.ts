import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ passportId: string }> }) {
  const { passportId } = await params;
  const db = createAdminClient();
  const { data } = await db.from("activity_feed").select("*").eq("passport_id", passportId).order("created_at", { ascending: false }).limit(50);
  return NextResponse.json({ entries: data ?? [] });
}
