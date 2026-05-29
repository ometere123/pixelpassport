"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddress } from "@/lib/utils/cn";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="px-3 py-1.5 rounded-md text-sm font-mono"
          style={{ background: "var(--surface-soft)", color: "var(--passport-gold)" }}
        >
          {shortAddress(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white transition-colors"
          style={{ background: "var(--surface)" }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const injected = connectors.find((c) => c.type === "injected");
        const connector = injected ?? connectors[0];
        if (connector) connect({ connector });
      }}
      className="px-4 py-2 rounded-md text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
      style={{
        background: "linear-gradient(135deg, var(--passport-gold), #FFD580)",
        color: "#090A12",
      }}
    >
      Connect Wallet
    </button>
  );
}
