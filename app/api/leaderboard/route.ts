import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db = createAdminClient();
  const { data } = await db.from("passports").select("id, username, avatar_url, ecosystem_xp, level").order("ecosystem_xp", { ascending: false }).limit(50);
  const entries = (data ?? []).map((p, i) => ({
    rank: i + 1,
    passport_id: p.id,
    username: p.username,
    avatar_url: p.avatar_url,
    score: p.ecosystem_xp,
    level: p.level,
    game_id: "ecosystem",
  }));
  return NextResponse.json({ entries });
}
