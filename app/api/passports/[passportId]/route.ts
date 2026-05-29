import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ passportId: string }> }) {
  const { passportId } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("passports").select("*").eq("id", passportId).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ passportId: string }> }) {
  const { passportId } = await params;
  const body = await req.json();
  const db = createAdminClient();
  const { data, error } = await db.from("passports").update(body).eq("id", passportId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
