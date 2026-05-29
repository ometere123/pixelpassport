import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("passports").select("*").eq("owner", wallet.toLowerCase()).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
