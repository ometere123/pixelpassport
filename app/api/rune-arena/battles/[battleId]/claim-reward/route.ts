import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/utils/cn";

const REWARD_ITEMS = [
  { name: "Ember Blade", class: "weapon", rarity: "uncommon", power_level: 35, traits: ["fire_affinity", "cutting_edge", "combat_heat"], lore: "Forged in the heat of arena victory." },
  { name: "Iron Rune Shield", class: "armor", rarity: "uncommon", power_level: 28, traits: ["iron_ward", "rune_guard"], lore: "A shield etched with protective runes." },
  { name: "Arcane Rune Fragment", class: "rune", rarity: "rare", power_level: 42, traits: ["arcane_affinity", "mana_surge", "runic_power"], lore: "A fragment of pure arcane energy." },
  { name: "Combat Mantle", class: "combat_relic", rarity: "common", power_level: 22, traits: ["battle_hardened"], lore: "Worn by many arena veterans." },
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const body = await req.json();
  const { passport_id } = body;

  const db = createAdminClient();
  const { data: battle, error } = await db.from("rune_battles").select("*").eq("id", battleId).single();
  if (error || !battle) return NextResponse.json({ error: "Battle not found" }, { status: 404 });
  if (battle.winner !== "player") return NextResponse.json({ error: "Only winner can claim reward" }, { status: 400 });
  if (battle.reward_item_id) return NextResponse.json({ error: "Reward already claimed" }, { status: 400 });

  const rewardTemplate = REWARD_ITEMS[Math.floor(Math.random() * REWARD_ITEMS.length)];
  const itemId = generateId("item");

  // Create item in DB
  const { data: item, error: itemErr } = await db.from("items").insert({
    id: itemId,
    name: rewardTemplate.name,
    class: rewardTemplate.class,
    rarity: rewardTemplate.rarity,
    power_level: rewardTemplate.power_level,
    traits: rewardTemplate.traits,
    lore: rewardTemplate.lore,
    origin_game: "rune-arena",
    owner_passport_id: passport_id,
    is_translated: false,
  }).select().single();

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

  // Update battle
  await db.from("rune_battles").update({ reward_item_id: itemId }).eq("id", battleId);

  // Record activity
  if (passport_id) {
    await db.from("activity_feed").insert({
      passport_id,
      game_id: "rune-arena",
      type: "item_earned",
      title: `${rewardTemplate.name} earned`,
      description: `Claimed as battle reward from RuneArena`,
      metadata: { item_id: itemId, battle_id: battleId },
    });
  }

  return NextResponse.json({ item });
}
