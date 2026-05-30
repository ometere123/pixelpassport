/**
 * Live GenLayer integration.
 *
 * Two clients live here:
 *   1. readClient — no account, used for view methods (safe in browser & server).
 *   2. walletClient(account) — uses the user's connected wallet for write methods.
 *
 * GenLayer Studio (chain id 61999) handles its own consensus over LLM calls;
 * we just submit transactions and wait for `ACCEPTED` status.
 */

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Account, Address } from "viem";

const ENDPOINT = (process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
  "https://studio.genlayer.com/api") as `http${string}`;

export const GENLAYER_CHAIN_ID = 61999;

export const CONTRACTS = {
  PASSPORT_REGISTRY: process.env
    .NEXT_PUBLIC_PASSPORT_REGISTRY_ADDRESS as Address,
  ITEM_REGISTRY: process.env.NEXT_PUBLIC_ITEM_REGISTRY_ADDRESS as Address,
  RUNE_ARENA: process.env.NEXT_PUBLIC_RUNE_ARENA_ADDRESS as Address,
  CHAIN_FARM: process.env.NEXT_PUBLIC_CHAIN_FARM_ADDRESS as Address,
  VOID_RUN: process.env.NEXT_PUBLIC_VOID_RUN_ADDRESS as Address,
  ECOSYSTEM_GOVERNANCE: process.env
    .NEXT_PUBLIC_ECOSYSTEM_GOVERNANCE_ADDRESS as Address,
} as const;

export type ContractName = keyof typeof CONTRACTS;

/** Read-only client. Cached singleton. */
let _readClient: ReturnType<typeof createClient> | null = null;
export function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet, endpoint: ENDPOINT });
  }
  return _readClient;
}

/** Wallet-enabled client. NOT cached — bound to a specific account. */
export function getWalletClient(account: Account | Address) {
  return createClient({ chain: studionet, endpoint: ENDPOINT, account });
}

/**
 * Call a read-only view method.
 * Returns whatever the contract returned (usually a JSON string the contract built).
 */
export async function readContract(
  contract: ContractName,
  functionName: string,
  args: unknown[] = []
): Promise<unknown> {
  const client = getReadClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (client as any).readContract({
      address: CONTRACTS[contract],
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: args as any,
    });
    return result;
  } catch (err) {
    console.error(`[GenLayer.read] ${contract}.${functionName} failed`, err);
    throw err;
  }
}

/**
 * Parse a contract response that may be a JSON string OR an already-parsed object.
 * Most contract methods return `json.dumps(...)` so we get a string back.
 */
/** Postgres TIMESTAMPTZ rejects empty strings — convert "" / undefined to null. */
export function tsOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function parseContractResult<T = unknown>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    if (raw === "") return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
  return raw as T;
}

/**
 * Write transaction submission + waiting helper.
 * Caller must pass a wallet-bound client (from useGenLayerWallet on client side
 * or from getWalletClient with an operator account on server side).
 */
export async function submitTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  contract: ContractName,
  functionName: string,
  args: unknown[] = []
): Promise<{ hash: string; receipt: unknown; result: unknown }> {
  const hash = await client.writeContract({
    address: CONTRACTS[contract],
    functionName,
    args,
    value: 0n,
  });

  // Wait for the transaction to reach an accepted state.
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: "ACCEPTED",
    interval: 2000,
    retries: 30,
  });

  // Extract the contract's return value if present.
  let result: unknown = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = receipt as any;
  const returned =
    r?.consensus_data?.leader_receipt?.[0]?.result ??
    r?.txReceipt ??
    r?.data?.return ??
    null;
  if (returned) {
    result = parseContractResult(returned);
  }

  return { hash, receipt, result };
}
