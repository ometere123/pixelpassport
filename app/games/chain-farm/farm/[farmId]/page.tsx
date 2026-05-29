"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ChainFarmBoard } from "@/components/chain-farm/ChainFarmBoard";
import { generateId } from "@/lib/utils/cn";
import type { ChainFarm } from "@/types";

export default function FarmPage() {
  const params = useParams();
  const farmId = params.farmId as string;
  const { address } = useAccount();
  const [farm, setFarm] = useState<ChainFarm | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!passportId) return;
    const newId = generateId("farm");
    const res = await fetch("/api/chain-farm/farms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farm_id: newId, passport_id: passportId }),
    });
    const d = await res.json();
    if (d.farm) setFarm(d.farm);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-2xl animate-spin">⟳</div></div>;

  if (farmId === "new" && !farm) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🌱</div>
        <h1 className="text-xl font-bold mb-2">Create Your Farm</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Start fresh on the blockchain plains.
        </p>
        <button onClick={createFarm}
          className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90"
          style={{ background: "#65D46E", color: "#090A12" }}>
          Create Farm
        </button>
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
