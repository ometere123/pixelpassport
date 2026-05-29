import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ACTIONS = ["strike", "guard", "focus", "rune_cast", "item_action"];

function simulateTurn(action: string, playerHP: number, oppHP: number, oppAttack: number) {
  const actionMap: Record<string, { dealt: [number, number]; taken: [number, number] }> = {
    strike: { dealt: [15, 25], taken: [8, 15] },
    guard: { dealt: [3, 8], taken: [2, 6] },
    focus: { dealt: [8, 15], taken: [5, 10] },
    rune_cast: { dealt: [20, 35], taken: [0, 8] },
    item_action: { dealt: [18, 28], taken: [6, 12] },
  };

  const cfg = actionMap[action] ?? actionMap.strike;
  const dealt = Math.floor(Math.random() * (cfg.dealt[1] - cfg.dealt[0])) + cfg.dealt[0];
  const taken = Math.floor(Math.random() * (cfg.taken[1] - cfg.taken[0])) + cfg.taken[0];

  const narrations: Record<string, string[]> = {
    strike: [
      "You drive forward with a fierce strike. The blow lands true.",
      "Your blade cuts through the air. Impact registered.",
    ],
    guard: [
      "You raise your guard. The opponent's attack glances off.",
      "Defensive stance holds. Minimal damage taken.",
    ],
    focus: [
      "You focus your energy. Power building for the next blow.",
      "Inner rune awakens. Your concentration sharpens.",
    ],
    rune_cast: [
      "A rune blazes to life. Magical energy erupts from your hand.",
      "The arena crackles with arcane force as your cast lands.",
    ],
    item_action: [
      "Your item surges with power. A decisive blow.",
      "The translated relic pulses. Cross-world energy strikes.",
    ],
  };

  const narrationArr = narrations[action] ?? narrations.strike;
  const narration = narrationArr[Math.floor(Math.random() * narrationArr.length)];

  const newPlayerHP = Math.max(0, playerHP - taken);
  const newOppHP = Math.max(0, oppHP - dealt);

  return { dealt, taken, newPlayerHP, newOppHP, narration };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const body = await req.json();
  const { action } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Use: ${VALID_ACTIONS.join(", ")}` }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: battle, error } = await db.from("rune_battles").select("*").eq("id", battleId).single();
  if (error || !battle) return NextResponse.json({ error: "Battle not found" }, { status: 404 });
  if (battle.status !== "active") return NextResponse.json({ error: "Battle not active" }, { status: 400 });

  const opp = battle.opponent as Record<string, unknown>;
  const { dealt, taken, newPlayerHP, newOppHP, narration } = simulateTurn(
    action,
    battle.player_hp ?? 100,
    opp.hp as number ?? 80,
    opp.attack as number ?? 15
  );

  const turnRecord = {
    turn: (battle.turns as unknown[]).length + 1,
    action,
    player_damage_dealt: dealt,
    player_damage_taken: taken,
    player_hp_after: newPlayerHP,
    opp_hp_after: newOppHP,
    narration,
  };

  const updatedOpp = { ...opp, hp: newOppHP };
  const updatedNarration = [...(battle.narration ?? []), narration];
  const updatedTurns = [...(battle.turns as unknown[]), turnRecord];

  let status = "active";
  let winner = null;
  let xp_earned = 0;
  let finished_at = null;

  if (newPlayerHP === 0) {
    status = "finished";
    winner = "opponent";
    finished_at = new Date().toISOString();
  } else if (newOppHP === 0) {
    status = "finished";
    winner = "player";
    xp_earned = 250 + turnRecord.turn * 10;
    finished_at = new Date().toISOString();
  }

  const updatePayload: Record<string, unknown> = {
    player_hp: newPlayerHP,
    opponent: updatedOpp,
    turns: updatedTurns,
    narration: updatedNarration,
    status,
    winner,
    xp_earned,
    finished_at,
  };

  const { data: updated, error: updateErr } = await db
    .from("rune_battles")
    .update(updatePayload)
    .eq("id", battleId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // If battle won, update passport XP
  if (winner === "player" && body.passport_id) {
    await db.from("passports")
      .update({ ecosystem_xp: db.rpc as unknown as number })
      .eq("id", body.passport_id);
    // Simple XP update
    const { data: passport } = await db.from("passports").select("ecosystem_xp, level").eq("id", body.passport_id).single();
    if (passport) {
      const newXp = (passport.ecosystem_xp ?? 0) + xp_earned;
      const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);
      await db.from("passports").update({ ecosystem_xp: newXp, level: newLevel }).eq("id", body.passport_id);
      await db.from("activity_feed").insert({
        passport_id: body.passport_id,
        game_id: "rune-arena",
        type: "battle_won",
        title: "Battle Won in RuneArena",
        description: `Defeated ${opp.name} and earned ${xp_earned} XP`,
        metadata: { battle_id: battleId, xp_earned },
      });
    }
  }

  return NextResponse.json({ battle: updated, turn: turnRecord });
}
