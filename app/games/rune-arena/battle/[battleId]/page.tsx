"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { RuneArenaBattle } from "@/components/rune-arena/RuneArenaBattle";
import { ArenaLoadoutSelector } from "@/components/rune-arena/ArenaLoadoutSelector";
import { generateId } from "@/lib/utils/cn";
import type { RuneBattle } from "@/types";

export default function BattlePage() {
  const params = useParams();
  const battleId = params.battleId as string;
  const { address } = useAccount();
  const [battle, setBattle] = useState<RuneBattle | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadout, setShowLoadout] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setPassportId(data.id);
      })
      .catch(() => {});
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
    if (!passportId) return;
    const newId = generateId("battle");
    const res = await fetch("/api/rune-arena/battles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battle_id: newId, passport_id: passportId, loadout }),
    });
    const data = await res.json();
    if (data.battle) {
      setBattle(data.battle);
      setShowLoadout(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl animate-spin">⟳</div>
      </div>
    );
  }

  if (showLoadout) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Select Loadout</h1>
        <ArenaLoadoutSelector passportId={passportId ?? ""} onConfirm={handleCreateBattle} />
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
