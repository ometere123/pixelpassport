"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import {
  loadKey,
  saveKey,
  regenerateKey,
  getAddressForKey,
  isValidPrivateKey,
} from "@/lib/genlayer/keyStore";
import { shortAddress } from "@/lib/utils/cn";

type Modal = null | "export" | "import" | "regenerate";

function emitKeyChange() {
  window.dispatchEvent(new Event("pixelpassport:keychange"));
}

export default function AccountPage() {
  const { address: walletAddress, isConnected } = useAccount();
  const router = useRouter();
  const [glAddress, setGlAddress] = useState("");
  const [glKey, setGlKey] = useState<`0x${string}` | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    const key = loadKey();
    if (key) {
      setGlKey(key);
      setGlAddress(getAddressForKey(key));
    }
  }, []);

  function refresh() {
    const key = loadKey();
    if (key) {
      setGlKey(key);
      setGlAddress(getAddressForKey(key));
    } else {
      setGlKey(null);
      setGlAddress("");
    }
    emitKeyChange();
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-3">Account</h1>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            Connect your wallet to manage your GenLayer signing key.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your wallet identity and GenLayer signing key.
        </p>
      </div>

      {/* Wallet identity */}
      <section className="rounded-2xl p-6 border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>HUMAN IDENTITY</div>
            <h2 className="font-bold mb-1">MetaMask Wallet</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Used as your identity label. Does not sign GenLayer transactions.
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm" style={{ color: "var(--passport-gold)" }}>
              {shortAddress(walletAddress!)}
            </div>
          </div>
        </div>
      </section>

      {/* GenLayer signing key */}
      <section className="rounded-2xl p-6 border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: "var(--pixel-cyan)" }}>GENLAYER SIGNING KEY</div>
            <h2 className="font-bold mb-1">Browser Key</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Signs all on-chain transactions. Stored in this browser only — back it up.
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm" style={{ color: "var(--pixel-cyan)" }}>
              {glAddress ? shortAddress(glAddress) : "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setModal("export")}
            disabled={!glKey}
            className="py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          >
            ⤓ Export Key
          </button>
          <button
            onClick={() => setModal("import")}
            className="py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          >
            ⤒ Import Key
          </button>
          <button
            onClick={() => setModal("regenerate")}
            className="py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}
          >
            ↻ Regenerate
          </button>
        </div>

        <div className="mt-6 p-3 rounded-lg text-xs" style={{ background: "rgba(246,200,95,0.08)", color: "var(--passport-gold)" }}>
          ⚠ <strong>Back up your key.</strong> Anyone with this private key controls your passport, items, and game progress. If you clear browser data without exporting first, your passport is unrecoverable.
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "rgba(239,68,68,0.2)" }}>
        <h2 className="font-bold mb-2" style={{ color: "var(--danger)" }}>Studio Explorer</h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          View your transactions and contract state directly on GenLayer Studio.
        </p>
        <a
          href={`https://explorer-studio.genlayer.com/address/${glAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-2 px-4 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
        >
          Open in Explorer ↗
        </a>
      </section>

      {modal === "export" && glKey && (
        <ExportModal privateKey={glKey} onClose={() => setModal(null)} />
      )}
      {modal === "import" && (
        <ImportModal
          onClose={() => setModal(null)}
          onImported={() => {
            refresh();
            setModal(null);
            router.refresh();
          }}
        />
      )}
      {modal === "regenerate" && (
        <RegenerateModal
          onClose={() => setModal(null)}
          onConfirm={() => {
            regenerateKey();
            refresh();
            setModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ────────── Modals ────────── */

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ExportModal({ privateKey, onClose }: { privateKey: string; onClose: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <ModalShell title="Export GenLayer Key" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          ⚠ <strong>Do not share this key.</strong> Anyone with it can sign transactions as you. Save it somewhere only you can access — a password manager, an encrypted note, or a piece of paper.
        </div>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-3 rounded-lg font-semibold text-sm"
            style={{ background: "var(--passport-gold)", color: "#090A12" }}
          >
            I understand — reveal key
          </button>
        ) : (
          <>
            <div className="p-3 rounded-lg font-mono text-xs break-all"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}>
              {privateKey}
            </div>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(privateKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="w-full py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
            >
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleImport() {
    const trimmed = value.trim();
    const normalized = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
    if (!isValidPrivateKey(normalized)) {
      setError("Invalid private key. Must be 64 hex characters (with or without 0x prefix).");
      return;
    }
    saveKey(normalized as `0x${string}`);
    onImported();
  }

  return (
    <ModalShell title="Import GenLayer Key" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(246,200,95,0.08)", color: "var(--passport-gold)" }}>
          ⚠ This replaces your current key. Export your existing key first if you don't want to lose access to its passport.
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Private key</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0x…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg font-mono text-xs outline-none resize-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
        </div>
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
            {error}
          </div>
        )}
        <button
          onClick={handleImport}
          disabled={!value.trim()}
          className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ background: "var(--passport-gold)", color: "#090A12" }}
        >
          Import & Replace
        </button>
      </div>
    </ModalShell>
  );
}

function RegenerateModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const ok = confirmText === "REGENERATE";
  return (
    <ModalShell title="Regenerate GenLayer Key" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
          ⚠ This generates a brand-new key. <strong>You will lose access to the passport tied to your current key</strong> unless you exported it first.
        </div>
        <div>
          <label className="block text-sm mb-2">
            Type <span className="font-mono">REGENERATE</span> to confirm:
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg font-mono text-sm outline-none"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
          />
        </div>
        <button
          onClick={onConfirm}
          disabled={!ok}
          className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ background: ok ? "var(--danger)" : "var(--surface-soft)", color: ok ? "white" : "var(--text-muted)" }}
        >
          Regenerate Key
        </button>
      </div>
    </ModalShell>
  );
}
