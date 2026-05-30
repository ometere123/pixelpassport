import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ACTIONS = ["strike", "guard", "focus", "rune_cast", "item_action"];

function simulateTurn(action: string, playerHP: number, oppHP: number) {
  const actionMap: Record<string, { dealt: [number, number]; taken: [number, number] }> = {
    strike:      { dealt: [15, 25], taken: [8, 15] },
    guard:       { dealt: [3,  8],  taken: [2,  6]  },
    focus:       { dealt: [8, 15],  taken: [5, 10]  },
    rune_cast:   { dealt: [20, 35], taken: [0,  8]  },
    item_action: { dealt: [18, 28], taken: [6, 12]  },
  };

  const cfg = actionMap[action] ?? actionMap.strike;
  const dealt = Math.floor(Math.random() * (cfg.dealt[1] - cfg.dealt[0])) + cfg.dealt[0];
  const taken  = Math.floor(Math.random() * (cfg.taken[1]  - cfg.taken[0]))  + cfg.taken[0];

  const narrations: Record<string, string[]> = {
    strike:      ["You drive forward with a fierce strike. The blow lands true.", "Your blade cuts through the air. Impact registered."],
    guard:       ["You raise your guard. The opponent's attack glances off.", "Defensive stance holds. Minimal damage taken."],
    focus:       ["You focus your energy. Power building for the next blow.", "Inner rune awakens. Your concentration sharpens."],
    rune_cast:   ["A rune blazes to life. Magical energy erupts from your hand.", "The arena crackles with arcane force as your cast lands."],
    item_action: ["Your item surges with power. A decisive blow.", "The translated relic pulses. Cross-world energy strikes."],
  };

  const pool = narrations[action] ?? narrations.strike;
  const narration = pool[Math.floor(Math.random() * pool.length)];

  return {
    dealt,
    taken,
    newPlayerHP: Math.max(0, playerHP - taken),
    newOppHP:    Math.max(0, oppHP    - dealt),
    narration,
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const body = await req.json();
  const { action, passport_id } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Use: ${VALID_ACTIONS.join(", ")}` }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: battle, error } = await db.from("rune_battles").select("*").eq("id", battleId).single();
  if (error || !battle) return NextResponse.json({ error: "Battle not found" }, { status: 404 });
  if (battle.status !== "active") return NextResponse.json({ error: "Battle not active" }, { status: 400 });

  // State is stored in turns — turns[0] is the init record
  const turns = (battle.turns ?? []) as Record<string, unknown>[];
  const initState = turns[0] ?? {};
  const opp = (initState.opponent ?? { name: "Shadow", hp: 80, attack: 15 }) as Record<string, unknown>;

  // Current HP: last turn's values or init values
  const lastTurn = turns.length > 1 ? turns[turns.length - 1] : null;
  const currentPlayerHP: number = lastTurn
    ? (lastTurn.player_hp_after as number ?? 100)
    : (initState.player_hp as number ?? 100);
  const currentOppHP: number = lastTurn
    ? (lastTurn.opp_hp_after as number ?? (opp.hp as number ?? 80))
    : (opp.hp as number ?? 80);

  const { dealt, taken, newPlayerHP, newOppHP, narration } = simulateTurn(action, currentPlayerHP, currentOppHP);

  const turnRecord = {
    turn: turns.length, // turns[0] = init, so real turn count starts at 1
    action,
    player_damage_dealt: dealt,
    player_damage_taken: taken,
    player_hp_after: newPlayerHP,
    opp_hp_after: newOppHP,
    narration,
  };

  const updatedNarration = [...(battle.narration ?? []), narration];
  const updatedTurns = [...turns, turnRecord];

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

  const { data: updated, error: updateErr } = await db
    .from("rune_battles")
    .update({ turns: updatedTurns, narration: updatedNarration, status, winner, xp_earned, finished_at })
    .eq("id", battleId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Award XP to passport on win
  if (winner === "player" && passport_id) {
    const { data: passport } = await db.from("passports").select("ecosystem_xp").eq("id", passport_id).single();
    if (passport) {
      const newXp = (passport.ecosystem_xp ?? 0) + xp_earned;
      const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);
      await db.from("passports").update({ ecosystem_xp: newXp, level: newLevel }).eq("id", passport_id);
      await db.from("activity_feed").insert({
        passport_id,
        game_id: "rune-arena",
        type: "battle_won",
        title: "Battle Won in RuneArena",
        description: `Defeated ${String(opp.name)} and earned ${xp_earned} XP`,
        metadata: { battle_id: battleId, xp_earned },
      });
    }
  }

  return NextResponse.json({ battle: updated, turn: turnRecord, player_hp: newPlayerHP, opp_hp: newOppHP });
}
