"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { VoidRunRoom } from "@/components/void-run/VoidRunRoom";
import { generateId } from "@/lib/utils/cn";
import type { VoidRun } from "@/types";

export default function VoidRunPage() {
  const params = useParams();
  const runId = params.runId as string;
  const { address } = useAccount();
  const [run, setRun] = useState<VoidRun | null>(null);
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
    if (runId === "new") { setLoading(false); return; }
    fetch(`/api/void-run/runs/${runId}`)
      .then((r) => r.json())
      .then((d) => setRun(d.run ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId]);

  async function startRun() {
    if (!passportId) return;
    const newId = generateId("run");
    const res = await fetch("/api/void-run/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: newId, passport_id: passportId, loadout: [] }),
    });
    const d = await res.json();
    if (d.run) setRun(d.run);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-2xl animate-spin">⟳</div></div>;

  if (runId === "new" && !run) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🌀</div>
        <h1 className="text-xl font-bold mb-2">Enter the Void</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          5 rooms await. GenLayer will judge your answers.
        </p>
        <button onClick={startRun}
          className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90"
          style={{ background: "#8B5CF6", color: "white" }}>
          Start Run
        </button>
      </div>
    );
  }

  if (!run) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-3xl mb-3">🌀</div>
        <h1 className="text-lg font-bold">Run not found</h1>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <VoidRunRoom run={run} passportId={passportId ?? ""} onUpdate={setRun} />
    </div>
  );
}
