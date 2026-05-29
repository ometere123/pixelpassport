import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROOM_TEMPLATES = [
  { type: "puzzle", title: "The Riddle Chamber", description: "A floating inscription pulses with void light. The ancient words demand an answer.", puzzle: "I have cities but no houses, mountains but no trees, water but no fish. What am I?", puzzle_type: "riddle", difficulty: 1, atmosphere: "mystical" },
  { type: "puzzle", title: "The Pattern Vault", description: "Void crystals arrange in sequences that shift as you watch.", puzzle: "Complete the sequence: 2, 6, 12, 20, 30, ?", puzzle_type: "pattern", difficulty: 2, atmosphere: "eerie" },
  { type: "combat", title: "The Void Sentinel", description: "A shadow-form blocks the passage. Its eyes glow with dimensional energy.", puzzle: null, puzzle_type: null, difficulty: 2, atmosphere: "dangerous" },
  { type: "puzzle", title: "The Logic Gate", description: "Three glowing lanterns float before you. Only one speaks truth.", puzzle: "You have 3 void lanterns. Two are cursed. A cursed lantern always lies. Lantern A says 'I am true.' Lantern B says 'A is cursed.' Which lantern do you trust?", puzzle_type: "logic", difficulty: 3, atmosphere: "eerie" },
  { type: "treasure", title: "The Void Vault", description: "The final chamber shimmers with crystallised void energy. A chest pulses with reward.", puzzle: null, puzzle_type: null, difficulty: 1, atmosphere: "serene" },
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("void_runs").select("*").eq("id", runId).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ run: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await req.json();
  const db = createAdminClient();

  const { data: run, error } = await db.from("void_runs").select("*").eq("id", runId).single();
  if (error || !run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "generate_room") {
    const roomIndex = run.current_room ?? 0;
    const template = ROOM_TEMPLATES[roomIndex % ROOM_TEMPLATES.length];
    const room = { index: roomIndex, ...template, completed: false, judgement: null };
    const rooms = [...((run.rooms as unknown[]) ?? [])];
    rooms[roomIndex] = room;
    await db.from("void_runs").update({ rooms }).eq("id", runId);
    return NextResponse.json({ room });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
