"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { VoidRunRoom } from "@/components/void-run/VoidRunRoom";
import { generateId } from "@/lib/utils/cn";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";
import { startRun as startRunTx, generateRoom } from "@/lib/genlayer/actions";
import type { VoidRun } from "@/types";

export default function VoidRunPage() {
  const params = useParams();
  const runId = params.runId as string;
  const { address } = useAccount();
  const { write, ready } = useGenLayer();
  const [run, setRun] = useState<VoidRun | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

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
    if (!passportId || !ready) return;
    setStarting(true);
    setError("");
    try {
      const newId = generateId("run");
      const out = await startRunTx(write, {
        runId: newId,
        passportId,
        loadout: [],
        totalRooms: 5,
      });
      // Now generate the first room
      const withRoom = await generateRoom(write, { runId: newId, passportId });
      if (withRoom.run) setRun(withRoom.run as unknown as VoidRun);
      else if (out.run) setRun(out.run as unknown as VoidRun);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-2xl animate-spin">⟳</div></div>;

  if (runId === "new" && !run) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🌀</div>
        <h1 className="text-xl font-bold mb-2">Enter the Void</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          5 rooms await. GenLayer&apos;s LLM judges every answer you give.
        </p>
        <button onClick={startRun} disabled={starting}
          className="px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#8B5CF6", color: "white" }}>
          {starting ? "Submitting…" : "Start Run"}
        </button>
        {starting && (
          <div className="mt-4 p-3 rounded-lg text-xs shimmer"
            style={{ background: "rgba(139,92,246,0.06)", color: "#8B5CF6" }}>
            ⬡ LLM is generating your first room…
            <div className="text-xs mt-1 opacity-70">(may take 30–60s)</div>
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
