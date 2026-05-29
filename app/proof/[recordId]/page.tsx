import { createAdminClient } from "@/lib/supabase/admin";
import type { GenLayerRecord } from "@/types";

interface PageProps {
  params: Promise<{ recordId: string }>;
}

export default async function ProofPage({ params }: PageProps) {
  const { recordId } = await params;
  let record: GenLayerRecord | null = null;

  try {
    const db = createAdminClient();
    const { data } = await db.from("transactions").select("*").eq("id", recordId).single();
    record = data as GenLayerRecord | null;
  } catch {}

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⬡</div>
          <h1 className="text-xl font-bold mb-2">Proof Not Found</h1>
          <p style={{ color: "var(--text-muted)" }}>This transaction record does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="text-xs font-mono mb-2" style={{ color: "var(--pixel-cyan)" }}>⬡ GENLAYER PROOF</div>
        <h1 className="text-2xl font-bold">Transaction Record</h1>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "rgba(56,217,248,0.2)" }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Contract</div>
              <div className="font-mono" style={{ color: "var(--pixel-cyan)" }}>{record.contract}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Action</div>
              <div className="font-mono" style={{ color: "var(--pixel-cyan)" }}>{record.action}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Status</div>
              <div className="font-mono" style={{
                color: record.status === "confirmed" ? "var(--success)" : record.status === "failed" ? "var(--danger)" : "var(--passport-gold)"
              }}>
                {record.status}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>TX ID</div>
              <div className="font-mono text-xs break-all">{record.tx_id ?? "pending"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>REQUEST PAYLOAD</div>
          <pre className="text-xs overflow-auto p-3 rounded"
            style={{ background: "var(--surface-soft)", color: "var(--text-main)" }}>
            {JSON.stringify(record.request_payload, null, 2)}
          </pre>
        </div>

        <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>RESPONSE PAYLOAD</div>
          <pre className="text-xs overflow-auto p-3 rounded"
            style={{ background: "var(--surface-soft)", color: "var(--text-main)" }}>
            {JSON.stringify(record.response_payload, null, 2)}
          </pre>
        </div>

        <div className="p-4 rounded-xl text-xs font-mono"
          style={{ background: "rgba(56,217,248,0.06)", color: "var(--pixel-cyan)" }}>
          ⬡ This record represents the authoritative GenLayer state. Supabase is a cache.
          If any discrepancy exists, GenLayer wins.
        </div>
      </div>
    </div>
  );
}
