"use client";

/**
 * High-level action helpers. Each one runs:
 *   1. write to the relevant GenLayer contract
 *   2. POST to the matching /api/genlayer/sync-* route to mirror state
 *   3. Return the parsed contract result + the synced cache row
 *
 * Pulls the active GenLayer key from useGenLayer's write fn passed in.
 */

import type { TxResult } from "./useGenLayer";
import { buildTranslationContext } from "./client";

type WriteFn = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  method: string,
  args: unknown[]
) => Promise<TxResult>;

async function sync(path: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/genlayer/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Sync failed");
  return data;
}

function checkContractError(result: unknown) {
  const err = (result as { error?: string } | null)?.error;
  if (err) throw new Error(`Contract: ${err}`);
}

/* ─── Item ─── */

export async function mintItem(
  write: WriteFn,
  args: {
    itemId: string;
    passportId: string;
    originGame: string;
    item: {
      name: string;
      class: string;
      rarity: string;
      power_level: number;
      traits: string[];
      lore?: string;
      metadata_uri?: string;
    };
  }
) {
  const tx = await write("ITEM_REGISTRY", "create_item", [
    args.itemId,
    args.passportId,
    args.originGame,
    JSON.stringify(args.item),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-item", {
    item_id: args.itemId,
    passport_id: args.passportId,
    origin_game: args.originGame,
    tx_hash: tx.hash,
  });
  return { tx, ...synced };
}

export async function translateItem(
  write: WriteFn,
  args: { itemId: string; targetGame: string; passportId?: string }
) {
  const context = buildTranslationContext(args.targetGame);
  const tx = await write("ITEM_REGISTRY", "translate_item", [
    args.itemId,
    args.targetGame,
    JSON.stringify(context),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-translation", {
    item_id: args.itemId,
    target_game: args.targetGame,
    passport_id: args.passportId,
    tx_hash: tx.hash,
  });
  return { tx, ...synced };
}

/* ─── RuneArena ─── */

export async function createBattle(
  write: WriteFn,
  args: { battleId: string; passportId: string; loadout: string[] }
) {
  const tx = await write("RUNE_ARENA", "create_battle", [
    args.battleId,
    args.passportId,
    JSON.stringify(args.loadout),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-battle", {
    battle_id: args.battleId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "create_battle",
  });
  return { tx, ...synced };
}

export async function startBattle(write: WriteFn, args: { battleId: string; passportId: string }) {
  const tx = await write("RUNE_ARENA", "start_battle", [args.battleId]);
  checkContractError(tx.result);
  const synced = await sync("sync-battle", {
    battle_id: args.battleId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "start_battle",
  });
  return { tx, ...synced };
}

export async function submitBattleAction(
  write: WriteFn,
  args: { battleId: string; passportId: string; action: string }
) {
  const tx = await write("RUNE_ARENA", "submit_action", [
    args.battleId,
    JSON.stringify({ action: args.action }),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-battle", {
    battle_id: args.battleId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: args.action,
  });
  return { tx, ...synced };
}

export async function resolveBattleTurn(
  write: WriteFn,
  args: { battleId: string; passportId: string }
) {
  const tx = await write("RUNE_ARENA", "resolve_turn", [args.battleId]);
  checkContractError(tx.result);
  const synced = await sync("sync-battle", {
    battle_id: args.battleId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "resolve_turn",
  });
  return { tx, ...synced };
}

export async function claimBattleReward(
  write: WriteFn,
  args: { battleId: string; passportId: string }
) {
  const tx = await write("RUNE_ARENA", "claim_battle_reward", [args.battleId]);
  checkContractError(tx.result);
  const synced = await sync("sync-battle", {
    battle_id: args.battleId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "claim_battle_reward",
  });
  // Result may contain newly minted item_id — sync it too
  const newItemId = (tx.result as { reward_item_id?: string } | null)?.reward_item_id;
  if (newItemId) {
    await sync("sync-item", {
      item_id: newItemId,
      passport_id: args.passportId,
      origin_game: "rune-arena",
      tx_hash: tx.hash,
    });
  }
  return { tx, ...synced, reward_item_id: newItemId };
}

/* ─── ChainFarm ─── */

export async function createFarm(
  write: WriteFn,
  args: { farmId: string; passportId: string }
) {
  const tx = await write("CHAIN_FARM", "create_farm", [args.farmId, args.passportId]);
  checkContractError(tx.result);
  const synced = await sync("sync-farm", {
    farm_id: args.farmId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "create_farm",
  });
  return { tx, ...synced };
}

export async function plantCrop(
  write: WriteFn,
  args: { farmId: string; plotId: string; crop: string; passportId: string }
) {
  const tx = await write("CHAIN_FARM", "plant_crop", [
    args.farmId,
    args.plotId,
    JSON.stringify({ crop: args.crop }),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-farm", {
    farm_id: args.farmId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "plant_crop",
  });
  return { tx, ...synced };
}

export async function useFarmItem(
  write: WriteFn,
  args: {
    farmId: string;
    itemId: string;
    translatedItem: Record<string, unknown>;
    passportId: string;
  }
) {
  const tx = await write("CHAIN_FARM", "use_farm_item", [
    args.farmId,
    args.itemId,
    JSON.stringify(args.translatedItem),
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-farm", {
    farm_id: args.farmId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "use_farm_item",
  });
  return { tx, ...synced };
}

export async function harvestCrop(
  write: WriteFn,
  args: { farmId: string; plotId: string; passportId: string }
) {
  const tx = await write("CHAIN_FARM", "harvest_crop", [args.farmId, args.plotId]);
  checkContractError(tx.result);
  const synced = await sync("sync-farm", {
    farm_id: args.farmId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "harvest_crop",
  });
  return { tx, ...synced };
}

/* ─── VoidRun ─── */

export async function startRun(
  write: WriteFn,
  args: { runId: string; passportId: string; loadout: string[]; totalRooms?: number }
) {
  const tx = await write("VOID_RUN", "start_run", [
    args.runId,
    args.passportId,
    JSON.stringify(args.loadout),
    args.totalRooms ?? 5,
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-run", {
    run_id: args.runId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "start_run",
  });
  return { tx, ...synced };
}

export async function generateRoom(
  write: WriteFn,
  args: { runId: string; passportId: string }
) {
  const tx = await write("VOID_RUN", "generate_room", [args.runId]);
  checkContractError(tx.result);
  const synced = await sync("sync-run", {
    run_id: args.runId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "generate_room",
  });
  return { tx, ...synced };
}

export async function judgePuzzleAnswer(
  write: WriteFn,
  args: { runId: string; roomIndex: number; answer: string; passportId: string }
) {
  const tx = await write("VOID_RUN", "judge_puzzle_answer", [
    args.runId,
    args.roomIndex,
    args.answer,
  ]);
  checkContractError(tx.result);
  const synced = await sync("sync-run", {
    run_id: args.runId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "judge_puzzle_answer",
  });
  return { tx, ...synced };
}

export async function claimVoidReward(
  write: WriteFn,
  args: { runId: string; passportId: string }
) {
  const tx = await write("VOID_RUN", "claim_void_reward", [args.runId]);
  checkContractError(tx.result);
  const synced = await sync("sync-run", {
    run_id: args.runId,
    passport_id: args.passportId,
    tx_hash: tx.hash,
    action: "claim_void_reward",
  });
  const newItemId = (tx.result as { reward_item_id?: string } | null)?.reward_item_id;
  if (newItemId) {
    await sync("sync-item", {
      item_id: newItemId,
      passport_id: args.passportId,
      origin_game: "void-run",
      tx_hash: tx.hash,
    });
  }
  return { tx, ...synced, reward_item_id: newItemId };
}
