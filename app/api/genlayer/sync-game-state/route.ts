import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { game_id, passport_id } = body;
  return NextResponse.json({ ok: true, synced: { game_id, passport_id }, at: new Date().toISOString() });
}
