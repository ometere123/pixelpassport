import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContract, parseContractResult } from "@/lib/genlayer/live";

/**
 * Mirror an on-chain EcosystemGovernance proposal into Supabase.
 * Body: { proposal_id, passport_id, proposal_type?, tx_hash?, action?, payload? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { proposal_id, passport_id, proposal_type, tx_hash, action, payload } = body;
    if (!proposal_id) return NextResponse.json({ error: "proposal_id required" }, { status: 400 });

    const raw = await readContract("ECOSYSTEM_GOVERNANCE", "get_proposal", [proposal_id]);
    const onchain = parseContractResult<Record<string, unknown>>(raw);
    if (!onchain || (onchain as { error?: string }).error) {
      return NextResponse.json({ error: "Proposal not found on GenLayer", detail: onchain }, { status: 404 });
    }

    const db = createAdminClient();
    const { data, error } = await db.from("governance_proposals").upsert(
      {
        id: proposal_id,
        proposer_passport_id: passport_id ?? null,
        type: proposal_type ?? String(onchain.type ?? "general"),
        title: String(onchain.title ?? "Untitled"),
        description: String(onchain.description ?? ""),
        payload: onchain.payload ?? {},
        status: String(onchain.status ?? "pending"),
        votes_for: Number(onchain.votes_for ?? 0),
        votes_against: Number(onchain.votes_against ?? 0),
        executed_at: (onchain.executed_at as string | null) || null,
      },
      { onConflict: "id" }
    ).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If this was a vote, also record the vote row
    if (action === "vote" && passport_id && payload) {
      const { support, reason } = payload as { support: boolean; reason: string };
      await db.from("governance_votes").upsert(
        { proposal_id, passport_id, support, reason: reason ?? "" },
        { onConflict: "proposal_id,passport_id" }
      );

      await db.from("activity_feed").insert({
        passport_id,
        game_id: "ecosystem",
        type: "xp_gained",
        title: support ? "Voted For" : "Voted Against",
        description: `${data?.title ?? proposal_id} — ${reason || "no reason given"}`,
        metadata: { proposal_id, support, tx_hash },
      });
    }

    if (action === "create_proposal" && passport_id) {
      await db.from("activity_feed").insert({
        passport_id,
        game_id: "ecosystem",
        type: "xp_gained",
        title: "Proposal Created",
        description: data?.title ?? proposal_id,
        metadata: { proposal_id, tx_hash },
      });
    }

    if (passport_id) {
      await db.from("transactions").insert({
        passport_id,
        contract: "EcosystemGovernance",
        action: action ?? "sync",
        request_payload: { proposal_id, ...(payload ?? {}) },
        response_payload: { ok: true, onchain },
        tx_id: tx_hash ?? null,
        status: "confirmed",
      });
    }

    return NextResponse.json({ proposal: data, onchain });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-proposal]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
