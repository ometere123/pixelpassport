import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const db = createAdminClient();
  const { data } = await db.from("item_translations").select("*").eq("item_id", itemId).order("created_at");
  return NextResponse.json({ history: data ?? [] });
}
