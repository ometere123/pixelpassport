import type { Game, GameId } from "@/types";

export const GAMES: Game[] = [
  {
    id: "rune-arena",
    name: "RuneArena",
    description: "A tactical combat arena powered by ancient runes and GenLayer AI adjudication.",
    color: "#F97373",
    accent: "#6B7280",
    icon: "⚔️",
    status: "active",
    contract_address: process.env.NEXT_PUBLIC_RUNE_ARENA_ADDRESS ?? null,
    allowed_item_classes: ["weapon", "armor", "rune", "combat_relic", "translated_relic"],
    balance_rules: { damage_cap: 50, magic_resistance_cap: 80, combo_limit: 3 },
  },
  {
    id: "chain-farm",
    name: "ChainFarm",
    description: "A blockchain farming economy where translated tools unlock powerful crop yields.",
    color: "#65D46E",
    accent: "#F6C85F",
    icon: "🌾",
    status: "active",
    contract_address: process.env.NEXT_PUBLIC_CHAIN_FARM_ADDRESS ?? null,
    allowed_item_classes: ["tool", "seed", "fertilizer", "harvest_relic", "translated_tool"],
    balance_rules: { yield_boost_cap: 3.0, growth_speed_cap: 2.0, plot_limit: 8 },
  },
  {
    id: "void-run",
    name: "VoidRun",
    description: "A puzzle-survival experience in the shifting void dimension, judged by GenLayer AI.",
    color: "#8B5CF6",
    accent: "#38D9F8",
    icon: "🌀",
    status: "active",
    contract_address: process.env.NEXT_PUBLIC_VOID_RUN_ADDRESS ?? null,
    allowed_item_classes: ["relic", "puzzle_tool", "void_artifact", "navigator", "translated_relic"],
    balance_rules: { puzzle_hint_limit: 2, damage_resistance_cap: 60, room_skip_limit: 1 },
  },
];

export function getGame(id: GameId): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
