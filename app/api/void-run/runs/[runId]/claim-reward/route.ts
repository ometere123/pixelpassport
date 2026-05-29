import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/utils/cn";

const VOID_REWARDS = [
  { name: "Void Crystal Shard", class: "void_artifact", rarity: "uncommon", power_level: 30, traits: ["void_affinity", "dimensional_memory"], lore: "A fragment of the void dimension, crystallised by your passage." },
  { name: "Dimensional Lens", class: "puzzle_tool", rarity: "rare", power_level: 45, traits: ["puzzle_insight", "void_sight", "pattern_read"], lore: "Reveals hidden patterns in any dimension." },
  { name: "Burning Dash Relic", class: "relic", power_level: 62, rarity: "rare", traits: ["ember_surge", "heat_memory", "void_affinity"], lore: "A shard of the original Ember Blade suspended in void-crystal, pulsing with ember light." },
  { name: "Null Navigator", class: "navigator", rarity: "epic", power_level: 70, traits: ["pathfinder", "void_compass", "dimensional_key"], lore: "An ancient compass that points toward the heart of any puzzle." },
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await req.json();
  const { passport_id } = body;

  const db = createAdminClient();
  const { data: run, error } = await db.from("void_runs").select("*").eq("id", runId).single();
  if (error || !run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status !== "finished") return NextResponse.json({ error: "Run not finished" }, { status: 400 });
  if (run.reward_item_id) return NextResponse.json({ error: "Reward already claimed" }, { status: 400 });

  // Pick reward based on score
  const score = run.score ?? 0;
  const rewardIdx = score > 200 ? 3 : score > 150 ? 2 : score > 100 ? 1 : 0;
  const rewardTemplate = VOID_REWARDS[Math.min(rewardIdx, VOID_REWARDS.length - 1)];
  const itemId = generateId("item");

  const { data: item, error: itemErr } = await db.from("items").insert({
    id: itemId,
    name: rewardTemplate.name,
    class: rewardTemplate.class,
    rarity: rewardTemplate.rarity,
    power_level: rewardTemplate.power_level,
    traits: rewardTemplate.traits,
    lore: rewardTemplate.lore,
    origin_game: "void-run",
    owner_passport_id: passport_id,
    is_translated: false,
  }).select().single();

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

  await db.from("void_runs").update({ reward_item_id: itemId, status: "claimed" }).eq("id", runId);

  if (passport_id) {
    await db.from("activity_feed").insert({
      passport_id,
      game_id: "void-run",
      type: "item_earned",
      title: `${rewardTemplate.name} earned`,
      description: `Claimed as void reward with score ${score}`,
      metadata: { item_id: itemId, run_id: runId, score },
    });
    // Award XP
    const { data: passport } = await db.from("passports").select("ecosystem_xp, level").eq("id", passport_id).single();
    if (passport) {
      const newXp = (passport.ecosystem_xp ?? 0) + score;
      await db.from("passports").update({ ecosystem_xp: newXp, level: Math.max(1, Math.floor(newXp / 1000) + 1) }).eq("id", passport_id);
    }
  }

  return NextResponse.json({ item });
}
