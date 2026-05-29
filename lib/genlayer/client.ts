import { createClient as createGenLayerClient } from "genlayer-js";
import type { TranslationResult } from "@/types";

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "61999");
const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "http://localhost:4000/api";

export function getGenLayerClient() {
  return createGenLayerClient({
    endpoint: RPC_URL as `http${string}`,
  });
}

export const CONTRACT_ADDRESSES = {
  PASSPORT_REGISTRY: process.env.NEXT_PUBLIC_PASSPORT_REGISTRY_ADDRESS as `0x${string}`,
  ITEM_REGISTRY: process.env.NEXT_PUBLIC_ITEM_REGISTRY_ADDRESS as `0x${string}`,
  RUNE_ARENA: process.env.NEXT_PUBLIC_RUNE_ARENA_ADDRESS as `0x${string}`,
  CHAIN_FARM: process.env.NEXT_PUBLIC_CHAIN_FARM_ADDRESS as `0x${string}`,
  VOID_RUN: process.env.NEXT_PUBLIC_VOID_RUN_ADDRESS as `0x${string}`,
  ECOSYSTEM_GOVERNANCE: process.env.NEXT_PUBLIC_ECOSYSTEM_GOVERNANCE_ADDRESS as `0x${string}`,
};

export async function callContractRead(
  contractAddress: `0x${string}`,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = []
): Promise<unknown> {
  const client = getGenLayerClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (client as any).readContract({
      address: contractAddress,
      functionName: method,
      args,
    });
    return result;
  } catch (err) {
    console.error(`[GenLayer] readContract error: ${method}`, err);
    throw err;
  }
}

export async function callContractWrite(
  contractAddress: `0x${string}`,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
  account?: `0x${string}`
): Promise<string> {
  const client = getGenLayerClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hash = await (client as any).writeContract({
      address: contractAddress,
      functionName: method,
      args,
      account: account ?? "0x0000000000000000000000000000000000000000",
    });
    return hash as string;
  } catch (err) {
    console.error(`[GenLayer] writeContract error: ${method}`, err);
    throw err;
  }
}

export function buildTranslationContext(targetGame: string): Record<string, unknown> {
  const contexts: Record<string, Record<string, unknown>> = {
    "rune-arena": {
      game: "RuneArena",
      world: "A tactical arena of ancient runes and combat magic",
      allowed_classes: ["weapon", "armor", "rune", "combat_relic"],
      max_power_level: 100,
      balance_rules: {
        damage_cap: 50,
        magic_resistance_cap: 80,
        combo_limit: 3,
      },
    },
    "chain-farm": {
      game: "ChainFarm",
      world: "A blockchain-powered pastoral land where magic meets agriculture",
      allowed_classes: ["tool", "seed", "fertilizer", "harvest_relic"],
      max_power_level: 60,
      balance_rules: {
        yield_boost_cap: 3.0,
        growth_speed_cap: 2.0,
        plot_limit: 8,
      },
    },
    "void-run": {
      game: "VoidRun",
      world: "A surreal dimension of shifting puzzles and cosmic trials",
      allowed_classes: ["relic", "puzzle_tool", "void_artifact", "navigator"],
      max_power_level: 80,
      balance_rules: {
        puzzle_hint_limit: 2,
        damage_resistance_cap: 60,
        room_skip_limit: 1,
      },
    },
  };
  return contexts[targetGame] || {};
}

export function parseMockTranslation(
  itemName: string,
  itemClass: string,
  targetGame: string
): TranslationResult {
  const translations: Record<string, Record<string, TranslationResult>> = {
    "Ember Blade": {
      "chain-farm": {
        translated_name: "Flame Plough",
        translated_class: "tool",
        translated_power_level: 45,
        abilities: ["Fire Till: Burns weeds on harvest", "Heat Boost: Accelerates Ember Grain growth by 40%"],
        visual_direction: "A plough blade forged from the same emberite ore, glowing faintly red at the edge",
        reasoning: "The Ember Blade's fire-affinity and cutting power map naturally to an agricultural ploughing tool. Its heat traits translate into crop acceleration for fire-aligned crops like Ember Grain.",
        balance_notes: "Capped at 45 power to respect ChainFarm's yield balance. Yield boost limited to 1.4x.",
        source_traits_used: ["fire_affinity", "cutting_edge", "combat_heat"],
      },
      "void-run": {
        translated_name: "Burning Dash Relic",
        translated_class: "relic",
        translated_power_level: 62,
        abilities: ["Ember Surge: Burns through puzzle barriers once per room", "Heat Memory: Reveals hidden fire-based clues"],
        visual_direction: "A shard of the original blade suspended in a void-crystal, pulsing with ember light",
        reasoning: "In VoidRun's surreal dimension, the Ember Blade's martial history becomes a charged memory artifact. Its fire lineage grants the ability to burn through dimensional barriers and sense heat-coded puzzles.",
        balance_notes: "Power set to 62, within void combat envelope. Room skip ability limited by global rule.",
        source_traits_used: ["fire_affinity", "blade_memory", "combat_heat", "elemental_edge"],
      },
    },
  };
  return (
    translations[itemName]?.[targetGame] ?? {
      translated_name: `${itemName} (${targetGame} Form)`,
      translated_class: "relic",
      translated_power_level: 40,
      abilities: [`Adapted from ${itemName}`],
      visual_direction: `A transformed version of the ${itemName} suited for ${targetGame}`,
      reasoning: `GenLayer adapted ${itemName} based on its ${itemClass} class and traits to fit the target world context.`,
      balance_notes: "Power capped to target game limits.",
      source_traits_used: [],
    }
  );
}
