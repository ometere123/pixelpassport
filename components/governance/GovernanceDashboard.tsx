"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { GovernanceProposalCard } from "./GovernanceProposalCard";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { createProposal } from "@/lib/genlayer/actions";
import { generateId } from "@/lib/utils/cn";
import type { GovernanceProposal } from "@/types";

type ProposalType = "add_game" | "item_class" | "translation_rule" | "general";

export function GovernanceDashboard() {
  const { address, isConnected } = useAccount();
  const { write, ready } = useGenLayer();
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProposalType>("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchProposals() {
    const res = await fetch("/api/governance/proposals", { cache: "no-store" });
    const data = await res.json();
    setProposals(data?.proposals ?? []);
  }

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    if (!isConnected || !address) return;
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then((d) => d?.id && setPassportId(d.id))
      .catch(() => {});
  }, [address, isConnected]);

  async function submitProposal() {
    if (!passportId || !ready) return;
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createProposal(write, {
        proposalId: generateId("prop"),
        proposalType: type,
        title: title.trim(),
        description: description.trim(),
        passportId,
      });
      setTitle("");
      setDescription("");
      setShowForm(false);
      fetchProposals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
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
                style={{ background: "rgba(34,197,94,0.15)", color: "var(--success, #22C55E)" }}>
                approved
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold">Proposals</h2>
        {passportId && (
          <button onClick={() => setShowForm((v) => !v)}
            className="px-3 py-1.5 rounded text-xs font-semibold hover:opacity-80"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}>
            {showForm ? "Cancel" : "+ New Proposal"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl p-5 border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--passport-gold)" }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProposalType)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}>
            <option value="general">General</option>
            <option value="add_game">Add Game</option>
            <option value="item_class">Item Class</option>
            <option value="translation_rule">Translation Rule</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the change you're proposing…"
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
          <button onClick={submitProposal} disabled={submitting || !title || !description}
            className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}>
            {submitting ? "Submitting to GenLayer…" : "Submit Proposal"}
          </button>
          {submitting && (
            <div className="p-2 rounded text-xs shimmer"
              style={{ background: "rgba(246,200,95,0.06)", color: "var(--passport-gold)" }}>
              ⬡ Waiting for consensus…
            </div>
          )}
          {error && (
            <div className="p-2 rounded text-xs"
              style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
              {error}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="rounded-xl p-8 text-center text-sm border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            No proposals yet. Be the first to propose a change to the protocol.
          </div>
        ) : (
          proposals.map((p) => (
            <GovernanceProposalCard
              key={p.id}
              proposal={p}
              passportId={passportId}
              onChange={fetchProposals}
            />
          ))
        )}
      </div>
    </div>
  );
}
