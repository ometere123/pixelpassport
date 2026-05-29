import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMockTranslation } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passport_id, wallet, username, avatar_url } = body;

    if (!passport_id || !wallet || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: "Username must be 3-30 characters" }, { status: 400 });
    }

    const db = createAdminClient();

    // Check if wallet already has a passport
    const { data: existing } = await db.from("passports").select("id").eq("owner", wallet).single();
    if (existing) {
      return NextResponse.json({ error: "Wallet already has a passport" }, { status: 409 });
    }

    // Check username uniqueness
    const { data: userExists } = await db.from("passports").select("id").eq("username", username).single();
    if (userExists) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passport = {
      id: passport_id,
      owner: wallet.toLowerCase(),
      username,
      avatar_url: avatar_url ?? null,
      ecosystem_xp: 0,
      level: 1,
      reputation: 100,
    };

    const { data, error } = await db.from("passports").insert(passport).select().single();
    if (error) throw error;

    // Record activity
    await db.from("activity_feed").insert({
      passport_id,
      game_id: "ecosystem",
      type: "passport_created",
      title: "Passport Created",
      description: `${username} joined the PixelPassport ecosystem`,
      metadata: { passport_id, wallet },
    });

    // Record GenLayer tx (mock for MVP)
    await db.from("transactions").insert({
      passport_id,
      contract: "PassportRegistry",
      action: "create_passport",
      request_payload: { passport_id, username },
      response_payload: { ok: true, passport_id },
      status: "confirmed",
    });

    return NextResponse.json({ passport: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Keep parseMockTranslation import used
void parseMockTranslation;
