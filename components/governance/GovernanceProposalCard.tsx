import type { GovernanceProposal } from "@/types";
import { timeAgo } from "@/lib/utils/cn";

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
}

export function GovernanceProposalCard({ proposal }: GovernanceProposalCardProps) {
  const total = proposal.votes_for + proposal.votes_against;
  const forPct = total > 0 ? (proposal.votes_for / total) * 100 : 0;

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
              style={{ background: STATUS_COLORS[proposal.status], color: STATUS_TEXT[proposal.status] }}>
              {proposal.status}
            </span>
          </div>
          <h3 className="font-semibold text-sm">{proposal.title}</h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{proposal.description}</p>
        </div>
      </div>

      {/* Vote bar */}
      <div className="mb-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-soft)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${forPct}%`, background: "var(--success)" }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          <span>For: {proposal.votes_for}</span>
          <span>Against: {proposal.votes_against}</span>
        </div>
      </div>

      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {timeAgo(proposal.created_at)}
      </div>
    </div>
  );
}
