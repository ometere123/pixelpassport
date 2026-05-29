import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { passport_id, contract, action, request_payload, response_payload, tx_id } = body;

  const db = createAdminClient();
  const { data, error } = await db.from("transactions").insert({
    passport_id: passport_id ?? null,
    contract,
    action,
    request_payload: request_payload ?? {},
    response_payload: response_payload ?? {},
    tx_id: tx_id ?? null,
    status: "confirmed",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: data }, { status: 201 });
}
