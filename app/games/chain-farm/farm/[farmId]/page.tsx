"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ChainFarmBoard } from "@/components/chain-farm/ChainFarmBoard";
import { generateId } from "@/lib/utils/cn";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { createFarm as createFarmTx } from "@/lib/genlayer/actions";
import type { ChainFarm } from "@/types";

export default function FarmPage() {
  const params = useParams();
  const farmId = params.farmId as string;
  const { address } = useAccount();
  const { write, ready } = useGenLayer();
  const [farm, setFarm] = useState<ChainFarm | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;
    fetch(`/api/passports/by-wallet/${address}`)
      .then((r) => r.json())
      .then((d) => { if (d?.id) setPassportId(d.id); })
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    if (farmId === "new") {
      setLoading(false);
      return;
    }
    fetch(`/api/chain-farm/farms/${farmId}`)
      .then((r) => r.json())
      .then((d) => setFarm(d.farm ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmId]);

  async function createFarm() {
    if (!passportId || !ready) return;
    setCreating(true);
    setError("");
    try {
      const newId = generateId("farm");
      const out = await createFarmTx(write, { farmId: newId, passportId });
      if (out.farm) {
        const built = { id: newId, passport_id: passportId, ...out.farm } as unknown as ChainFarm;
        setFarm(built);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create farm");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-2xl animate-spin">⟳</div></div>;

  if (farmId === "new" && !farm) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🌱</div>
        <h1 className="text-xl font-bold mb-2">Create Your Farm</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Signed by your GenLayer key, recorded on the ChainFarm contract.
        </p>
        <button onClick={createFarm} disabled={creating}
          className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#65D46E", color: "#090A12" }}>
          {creating ? "Submitting to GenLayer…" : "Create Farm"}
        </button>
        {creating && (
          <div className="mt-4 p-3 rounded-lg text-xs shimmer"
            style={{ background: "rgba(101,212,110,0.06)", color: "#65D46E" }}>
            ⬡ Waiting for consensus (30–60s)…
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

  if (!farm) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-3xl mb-3">🌾</div>
        <h1 className="text-lg font-bold">Farm not found</h1>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ChainFarmBoard farm={farm} passportId={passportId ?? ""} onUpdate={setFarm} />
    </div>
  );
}
