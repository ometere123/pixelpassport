"use client";
import { useState } from "react";

interface GenLayerProofPanelProps {
  contract: string;
  action: string;
  recordId: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
}

export function GenLayerProofPanel({
  contract,
  action,
  recordId,
  requestPayload,
  responsePayload,
}: GenLayerProofPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--surface)", borderColor: "rgba(56,217,248,0.2)" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--pixel-cyan)" }}>⬡</span>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--pixel-cyan)" }}>
            GenLayer Proof
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div
          className="border-t px-4 py-3 space-y-3 text-xs font-mono"
          style={{ borderColor: "rgba(56,217,248,0.15)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div style={{ color: "var(--text-muted)" }}>Contract</div>
              <div style={{ color: "var(--pixel-cyan)" }}>{contract}</div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)" }}>Action</div>
              <div style={{ color: "var(--pixel-cyan)" }}>{action}</div>
            </div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)" }}>Record ID</div>
            <div className="break-all" style={{ color: "var(--text-main)" }}>{recordId}</div>
          </div>
          {requestPayload && (
            <div>
              <div style={{ color: "var(--text-muted)" }}>Request</div>
              <div
                className="mt-1 p-2 rounded text-xs overflow-auto max-h-24"
                style={{ background: "var(--surface-soft)" }}
              >
                {JSON.stringify(requestPayload, null, 2)}
              </div>
            </div>
          )}
          {responsePayload && (
            <div>
              <div style={{ color: "var(--text-muted)" }}>Response</div>
              <div
                className="mt-1 p-2 rounded text-xs overflow-auto max-h-24"
                style={{ background: "var(--surface-soft)" }}
              >
                {JSON.stringify(responsePayload, null, 2)}
              </div>
            </div>
          )}
          <div
            className="p-2 rounded text-xs"
            style={{ background: "rgba(56,217,248,0.06)", color: "var(--text-muted)" }}
          >
            State verified on GenLayer. This proof is the authoritative record.
          </div>
        </div>
      )}
    </div>
  );
}
