"use client";
import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { generateId, shortAddress } from "@/lib/utils/cn";
import { useGenLayer } from "@/lib/genlayer/useGenLayer";

type Phase = "idle" | "uploading" | "signing" | "confirming" | "syncing" | "done";

export default function CreatePassportPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { write, ready, address: genlayerAddress } = useGenLayer();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarUrl("");
    setError("");
    setPhase("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/avatars/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setAvatarUrl(data.url);
      setPhase("idle");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setAvatarPreview("");
      setPhase("idle");
    }
  }

  function clearAvatar() {
    setAvatarUrl("");
    setAvatarPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCreate() {
    if (!address) return;
    if (!ready) {
      setError("GenLayer wallet still initialising — try again in a moment.");
      return;
    }
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    setError("");

    const passportId = generateId("passport");
    const metadataUri = avatarUrl ? JSON.stringify({ avatar: avatarUrl }) : "";

    try {
      // 1. Sign + submit create_passport to GenLayer
      setPhase("signing");
      const tx = await write("PASSPORT_REGISTRY", "create_passport", [
        passportId,
        username,
        metadataUri,
      ]);
      setTxHash(tx.hash);

      const contractError = (tx.result as { error?: string } | null)?.error;
      if (contractError) throw new Error(`Contract: ${contractError}`);

      // 2. Sync to Supabase cache
      setPhase("syncing");
      const syncRes = await fetch("/api/genlayer/sync-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passport_id: passportId,
          wallet: address,
          avatar_url: avatarUrl || null,
          tx_hash: tx.hash,
        }),
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData.error ?? "Sync failed");

      setPhase("done");
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create passport");
      setPhase("idle");
    }
  }

  const phaseLabels: Record<Phase, string> = {
    idle: "Create Passport",
    uploading: "Waiting for upload…",
    signing: "Submitting to GenLayer…",
    confirming: "Waiting for consensus…",
    syncing: "Syncing to cache…",
    done: "Passport created!",
  };

  const isBusy = phase !== "idle" && phase !== "done";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🪪</div>
          <h1 className="text-2xl font-bold mb-1">Create Your Passport</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            One identity across all worlds in the PixelPassport ecosystem.
          </p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Connect your wallet to create a passport.
              </p>
              <WalletConnectButton />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3 rounded-lg" style={{ background: "var(--surface-soft)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Connected wallet</div>
                <div className="font-mono text-sm" style={{ color: "var(--passport-gold)" }}>
                  {shortAddress(address!)}
                </div>
                {genlayerAddress && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>GenLayer key</div>
                    <div className="font-mono text-xs" style={{ color: "var(--pixel-cyan)" }}>
                      {shortAddress(genlayerAddress)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  maxLength={30}
                  disabled={isBusy}
                  className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none transition-colors disabled:opacity-60"
                  style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                />
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  3–30 characters. This is your public identity.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Avatar <span style={{ color: "var(--text-muted)" }}>(optional)</span>
                </label>
                {avatarPreview ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2"
                      style={{ borderColor: "var(--passport-gold)" }}>
                      <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {phase === "uploading" ? (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--pixel-cyan)" }}>
                          <span className="animate-spin">⟳</span> Uploading…
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: "var(--farm-green)" }}>✓ Avatar uploaded</div>
                      )}
                      <button onClick={clearAvatar} disabled={isBusy} className="text-xs mt-1 underline disabled:opacity-50"
                        style={{ color: "var(--text-muted)" }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={isBusy}
                    className="w-full py-6 rounded-xl border-2 border-dashed text-sm transition-colors hover:opacity-80 disabled:opacity-50 flex flex-col items-center gap-2"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface-soft)" }}>
                    <span className="text-2xl">🖼️</span>
                    <span>Click to upload JPG, PNG or WEBP</span>
                    <span className="text-xs">Max 5 MB</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden" onChange={handleFileChange} />
              </div>

              {/* Phase indicator */}
              {isBusy && phase !== "uploading" && (
                <div className="p-3 rounded-lg text-sm flex items-center gap-2"
                  style={{ background: "rgba(56,217,248,0.08)", color: "var(--pixel-cyan)" }}>
                  <span className="animate-spin">⟳</span>
                  {phaseLabels[phase]}
                </div>
              )}

              {txHash && phase !== "idle" && (
                <div className="p-2 rounded text-xs font-mono break-all" style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
                  tx: {txHash}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isBusy || !username || !ready}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, var(--passport-gold), #FFD580)", color: "#090A12" }}
              >
                {phaseLabels[phase]}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Signed by your GenLayer key, recorded on PassportRegistry, cached in Supabase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
