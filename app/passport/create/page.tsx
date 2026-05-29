"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { generateId, shortAddress } from "@/lib/utils/cn";

export default function CreatePassportPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!address) return;
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    setError("");
    setIsCreating(true);

    try {
      const passportId = generateId("passport");
      const res = await fetch("/api/passports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passport_id: passportId,
          wallet: address,
          username,
          avatar_url: avatarUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create passport");
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create passport");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🪪</div>
          <h1 className="text-2xl font-bold mb-1">Create Your Passport</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            One identity across all worlds in the PixelPassport ecosystem.
          </p>
        </div>

        {/* Card */}
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
              {/* Wallet display */}
              <div className="p-3 rounded-lg" style={{ background: "var(--surface-soft)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Connected wallet</div>
                <div className="font-mono text-sm" style={{ color: "var(--passport-gold)" }}>
                  {shortAddress(address!)}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none transition-colors"
                  style={{
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  3–30 characters. This is your public identity.
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isCreating || !username}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, var(--passport-gold), #FFD580)",
                  color: "#090A12",
                }}
              >
                {isCreating ? "Creating passport..." : "Create Passport"}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Your passport is recorded on GenLayer and cached in Supabase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
