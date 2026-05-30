"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { RuneArenaBattle } from "@/components/rune-arena/RuneArenaBattle";
import { ArenaLoadoutSelector } from "@/components/rune-arena/ArenaLoadoutSelector";
import { generateId } from "@/lib/utils/cn";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { createBattle, startBattle } from "@/lib/genlayer/actions";
import type { RuneBattle } from "@/types";

export default function BattlePage() {
  const params = useParams();
  const battleId = params.battleId as string;
  const { address } = useAccount();
  const [battle, setBattle] = useState<RuneBattle | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [passportChecked, setPassportChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoadout, setShowLoadout] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const { write, ready } = useGenLayer();

  useEffect(() => {
    if (!address) {
      setPassportChecked(true);
      return;
    }
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setPassportId(data.id);
      })
      .catch(() => {})
      .finally(() => setPassportChecked(true));
  }, [address]);

  useEffect(() => {
    if (battleId === "new") {
      setLoading(false);
      setShowLoadout(true);
      return;
    }
    fetch(`/api/rune-arena/battles/${battleId}`)
      .then((r) => r.json())
      .then((data) => setBattle(data.battle ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [battleId]);

  async function handleCreateBattle(loadout: string[]) {
    if (!passportId || !ready) return;
    setCreating(true);
    setError("");
    try {
      const newId = generateId("battle");
      await createBattle(write, { battleId: newId, passportId, loadout });
      // Battle is created as "pending" — flip it to "active" immediately
      const started = await startBattle(write, { battleId: newId, passportId });
      if (started.battle) {
        setBattle(started.battle);
        setShowLoadout(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create battle");
    } finally {
      setCreating(false);
    }
  }

  if (loading || !passportChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl animate-spin">⟳</div>
      </div>
    );
  }

  if (!passportId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🪪</div>
        <h1 className="text-xl font-bold mb-2">No Passport Found</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          The wallet <span className="font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span> isn&apos;t linked to a passport yet.
          Create one to enter battle.
        </p>
        <Link href="/passport/create"
          className="inline-block px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90"
          style={{ background: "var(--passport-gold)", color: "#090A12" }}>
          Create Passport
        </Link>
      </div>
    );
  }

  if (showLoadout) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Select Loadout</h1>
        <ArenaLoadoutSelector passportId={passportId ?? ""} onConfirm={handleCreateBattle} />
        {creating && (
          <div className="mt-4 p-4 rounded-xl text-sm text-center shimmer"
            style={{ background: "rgba(56,217,248,0.05)", color: "var(--pixel-cyan)" }}>
            ⬡ Submitting battle to RuneArena contract on GenLayer…
            <div className="text-xs mt-2 opacity-70">(consensus may take 30–60s)</div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3">⚔️</div>
          <h1 className="text-lg font-bold">Battle not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <RuneArenaBattle battle={battle} onUpdate={setBattle} passportId={passportId ?? ""} />
    </div>
  );
}
