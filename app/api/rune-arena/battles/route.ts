import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { battle_id, passport_id, loadout } = body;

  if (!battle_id || !passport_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = createAdminClient();

  const opponentTemplates = [
    { name: "Iron Shade", hp: 80, attack: 15, defense: 8, rarity: "common" },
    { name: "Rune Wraith", hp: 100, attack: 20, defense: 12, rarity: "uncommon" },
    { name: "Ember Colossus", hp: 140, attack: 25, defense: 18, rarity: "rare" },
  ];
  const opponent = opponentTemplates[Math.floor(Math.random() * opponentTemplates.length)];

  const battle = {
    id: battle_id,
    passport_id,
    loadout: loadout ?? [],
    status: "pending",
    player_hp: 100,
    opponent,
    turns: [],
    winner: null,
    reward_item_id: null,
    xp_earned: 0,
    narration: [],
  };

  const { data, error } = await db.from("rune_battles").insert(battle).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ battle: data }, { status: 201 });
}
