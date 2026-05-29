import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function judgeAnswer(puzzle: string | null, puzzleType: string | null, answer: string) {
  if (!puzzle) return { accepted: true, confidence: 0.9, summary: "Non-puzzle room passed.", reasoning: "No puzzle to solve.", reward_modifier: "small", next_room_hint: "The void shifts ahead." };

  const ans = answer.toLowerCase().trim();

  // Simple keyword-based judging for MVP (real version uses GenLayer LLM)
  const answers: Record<string, string[]> = {
    "i have cities": ["map", "atlas"],
    "complete the sequence": ["42"],
    "three void lanterns": ["c", "lantern c", "neither", "b is lying"],
  };

  let accepted = false;
  let confidence = 0.3;

  for (const [key, validAnswers] of Object.entries(answers)) {
    if (puzzle.toLowerCase().includes(key)) {
      accepted = validAnswers.some((v) => ans.includes(v));
      confidence = accepted ? 0.85 : 0.2;
      break;
    }
  }

  // Creative questions: always partial credit for thoughtful answers
  if (!accepted && ans.length > 10 && puzzleType === "creative") {
    accepted = true;
    confidence = 0.6;
  }

  const reward_modifier = confidence > 0.8 ? "large" : confidence > 0.5 ? "moderate" : "none";

  return {
    accepted,
    confidence,
    summary: accepted ? "The void accepts your answer." : "The void rejects your offering.",
    reasoning: accepted
      ? "Your answer demonstrated understanding of the puzzle's core concept."
      : "Your answer did not satisfy the puzzle's requirements. Try thinking differently.",
    reward_modifier,
    next_room_hint: accepted ? "The next chamber opens. Something shifts in the dark." : "The room remains sealed. Another attempt or another path.",
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await req.json();
  const { answer, passport_id } = body;

  const db = createAdminClient();
  const { data: run, error } = await db.from("void_runs").select("*").eq("id", runId).single();
  if (error || !run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status !== "active") return NextResponse.json({ error: "Run not active" }, { status: 400 });

  const roomIndex = run.current_room ?? 0;
  const rooms = [...((run.rooms as Record<string, unknown>[]) ?? [])];
  const room = rooms[roomIndex] as Record<string, unknown> | undefined;

  if (!room) return NextResponse.json({ error: "Room not generated yet" }, { status: 400 });

  const judgement = judgeAnswer(room.puzzle as string | null, room.puzzle_type as string | null, answer ?? "proceed");

  // Update room
  room.completed = judgement.accepted;
  room.judgement = judgement;
  rooms[roomIndex] = room;

  const rewardMap: Record<string, number> = { none: 0, small: 25, moderate: 50, large: 100 };
  const scoreGain = rewardMap[judgement.reward_modifier] ?? 0;

  let newCurrentRoom = roomIndex;
  let newStatus = "active";
  let finished_at = null;

  if (judgement.accepted || room.type !== "puzzle") {
    newCurrentRoom = roomIndex + 1;
    if (newCurrentRoom >= (run.total_rooms ?? 5)) {
      newStatus = "finished";
      finished_at = new Date().toISOString();
    }
  }

  const { data: updated } = await db.from("void_runs").update({
    rooms,
    score: (run.score ?? 0) + scoreGain,
    current_room: newCurrentRoom,
    status: newStatus,
    finished_at,
  }).eq("id", runId).select().single();

  // Activity
  if (judgement.accepted && passport_id) {
    await db.from("activity_feed").insert({
      passport_id,
      game_id: "void-run",
      type: "puzzle_solved",
      title: "Void Puzzle Solved",
      description: `GenLayer confidence: ${Math.round(judgement.confidence * 100)}%`,
      metadata: { run_id: runId, room_index: roomIndex, confidence: judgement.confidence },
    });
  }

  return NextResponse.json({ run: updated, judgement });
}
