"use client";

import type { GovernanceProposal } from "@/types";
import { timeAgo } from "@/lib/utils/cn";
import { useState } from "react";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { voteOnProposal, executeProposal } from "@/lib/genlayer/actions";

const STATUS_COLORS: Record<string, string> = {
  pending: "rgba(246,200,95,0.15)",
  active: "rgba(56,217,248,0.15)",
  passed: "rgba(34,197,94,0.15)",
  rejected: "rgba(239,68,68,0.15)",
  executed: "rgba(139,92,246,0.15)",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "#F6C85F",
  active: "#38D9F8",
  passed: "#22C55E",
  rejected: "#EF4444",
  executed: "#8B5CF6",
};

interface GovernanceProposalCardProps {
  proposal: GovernanceProposal;
  passportId?: string | null;
  onChange?: () => void;
}

export function GovernanceProposalCard({ proposal, passportId, onChange }: GovernanceProposalCardProps) {
  const { write, ready } = useGenLayer();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "voting" | "executing">("idle");
  const [error, setError] = useState("");

  const total = proposal.votes_for + proposal.votes_against;
  const forPct = total > 0 ? (proposal.votes_for / total) * 100 : 0;
  const votable = proposal.status === "pending" || proposal.status === "active";
  const executable = proposal.status === "passed";

  async function castVote(support: boolean) {
    if (!passportId || !ready) return;
    setPhase("voting");
    setError("");
    try {
      await voteOnProposal(write, { proposalId: proposal.id, support, reason: reason || "", passportId });
      setOpen(false);
      setReason("");
      onChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setPhase("idle");
    }
  }

  async function runExecute() {
    if (!passportId || !ready) return;
    setPhase("executing");
    setError("");
    try {
      await executeProposal(write, { proposalId: proposal.id, passportId });
      onChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Execute failed");
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
              {proposal.type}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: STATUS_COLORS[proposal.status] ?? "var(--surface-soft)", color: STATUS_TEXT[proposal.status] ?? "var(--text-muted)" }}>
              {proposal.status}
            </span>
          </div>
          <h3 className="font-semibold text-sm">{proposal.title}</h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{proposal.description}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-soft)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${forPct}%`, background: "var(--success, #22C55E)" }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          <span>For: {proposal.votes_for}</span>
          <span>Against: {proposal.votes_against}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(proposal.created_at)}</div>
        {passportId && votable && (
          <button onClick={() => setOpen((v) => !v)}
            className="px-3 py-1.5 rounded text-xs font-semibold hover:opacity-80"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}>
            {open ? "Cancel" : "Vote"}
          </button>
        )}
        {passportId && executable && (
          <button onClick={runExecute} disabled={phase !== "idle"}
            className="px-3 py-1.5 rounded text-xs font-semibold hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--pixel-cyan)", color: "#090A12" }}>
            {phase === "executing" ? "Executing…" : "Execute on-chain"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
          <div className="flex gap-2">
            <button onClick={() => castVote(true)} disabled={phase !== "idle"}
              className="flex-1 py-2 rounded text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.15)", color: "var(--success, #22C55E)" }}>
              {phase === "voting" ? "Signing…" : "Vote For"}
            </button>
            <button onClick={() => castVote(false)} disabled={phase !== "idle"}
              className="flex-1 py-2 rounded text-xs font-semibold disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>
              {phase === "voting" ? "Signing…" : "Vote Against"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 rounded text-xs"
          style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
