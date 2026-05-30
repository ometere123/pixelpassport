"use client";

/**
 * useGenLayer — client-side hook for live contract calls.
 *
 * Architecture decision: each browser session gets its own GenLayer keypair
 * stored in localStorage. The user's MetaMask wallet is the human identity
 * shown in the UI; the GenLayer key signs gameplay txs without prompting.
 *
 * For multi-device support, the user would export/import this key. That's a
 * later concern — for now one-device-per-passport is fine.
 */

import { useCallback, useEffect, useState } from "react";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACTS, type ContractName, parseContractResult } from "./live";

const ENDPOINT = (process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
  "https://studio.genlayer.com/api") as `http${string}`;

const STORAGE_KEY = "pixelpassport.genlayer.privateKey";

function loadOrCreateKey(): `0x${string}` {
  if (typeof window === "undefined") return generatePrivateKey();
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && /^0x[0-9a-fA-F]{64}$/.test(existing)) {
    return existing as `0x${string}`;
  }
  const fresh = generatePrivateKey();
  window.localStorage.setItem(STORAGE_KEY, fresh);
  return fresh;
}

export interface TxResult {
  hash: string;
  result: unknown;
  receipt: unknown;
}

export function useGenLayer() {
  const [account, setAccount] = useState<ReturnType<typeof createAccount> | null>(null);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const key = loadOrCreateKey();
    const acc = createAccount(key);
    setAccount(acc);
    setAddress(acc.address);
  }, []);

  const read = useCallback(
    async (contract: ContractName, functionName: string, args: unknown[] = []) => {
      const client = createClient({ chain: studionet, endpoint: ENDPOINT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (client as any).readContract({
        address: CONTRACTS[contract],
        functionName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: args as any,
      });
      return parseContractResult(raw);
    },
    []
  );

  const write = useCallback(
    async (
      contract: ContractName,
      functionName: string,
      args: unknown[] = []
    ): Promise<TxResult> => {
      if (!account) throw new Error("GenLayer account not initialised");
      const client = createClient({ chain: studionet, endpoint: ENDPOINT, account });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hash = await (client as any).writeContract({
        address: CONTRACTS[contract],
        functionName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: args as any,
        value: 0n,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receipt = await (client as any).waitForTransactionReceipt({
        hash,
        status: "ACCEPTED",
        interval: 2000,
        retries: 60,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = receipt as any;
      const returned =
        r?.consensus_data?.leader_receipt?.[0]?.result ??
        r?.txReceipt ??
        r?.data?.return ??
        null;
      const result = returned ? parseContractResult(returned) : null;
      return { hash, result, receipt };
    },
    [account]
  );

  return { address, account, read, write, ready: !!account };
}
