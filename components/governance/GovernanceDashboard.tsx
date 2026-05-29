import { GovernanceProposalCard } from "./GovernanceProposalCard";
import type { GovernanceProposal } from "@/types";

const SAMPLE_PROPOSALS: GovernanceProposal[] = [
  {
    id: "gov_001",
    proposer_passport_id: "ecosystem",
    type: "add_game",
    title: "Register SkyForge as approved ecosystem game",
    description: "SkyForge is an aerial combat game that wants to join the PixelPassport protocol.",
    payload: { game_id: "sky-forge", name: "SkyForge" },
    status: "pending",
    votes_for: 2,
    votes_against: 0,
    created_at: new Date().toISOString(),
    executed_at: null,
  },
  {
    id: "gov_002",
    proposer_passport_id: "ecosystem",
    type: "translation_rule",
    title: "Restrict legendary items from full power translation",
    description: "Legendary items should receive a 20% power reduction when translated to prevent ecosystem inflation.",
    payload: { power_reduction: 0.2, applies_to: "legendary" },
    status: "passed",
    votes_for: 5,
    votes_against: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    executed_at: null,
  },
];

export function GovernanceDashboard() {
  return (
    <div className="space-y-6">
      {/* Approved Games */}
      <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-4">Approved Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: "rune-arena", name: "RuneArena", type: "tactical_combat", icon: "⚔️" },
            { id: "chain-farm", name: "ChainFarm", type: "farming_economy", icon: "🌾" },
            { id: "void-run", name: "VoidRun", type: "puzzle_survival", icon: "🌀" },
          ].map((game) => (
            <div key={game.id} className="p-3 rounded-lg flex items-center gap-3"
              style={{ background: "var(--surface-soft)" }}>
              <span className="text-xl">{game.icon}</span>
              <div>
                <div className="font-semibold text-sm">{game.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{game.type}</div>
              </div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)" }}>
                approved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Proposals */}
      <div>
        <h2 className="font-bold mb-4">Active Proposals</h2>
        <div className="space-y-3">
          {SAMPLE_PROPOSALS.map((proposal) => (
            <GovernanceProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-3">Item Classes</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Governance controls which item classes are valid in the ecosystem. Currently managed by core team.
          </p>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-3">Translation Rules</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Global translation rules govern power limits, class mappings, and balance constraints.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl text-sm text-center" style={{ background: "rgba(246,200,95,0.06)", color: "var(--text-muted)" }}>
        Full governance voting will be enabled in a future protocol version via EcosystemGovernance.py on GenLayer.
      </div>
    </div>
  );
}
