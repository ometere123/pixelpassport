import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

export function levelFromXP(xp: number, xpPerLevel = 1000): number {
  return Math.max(1, Math.floor(xp / xpPerLevel) + 1);
}

export function xpToNextLevel(xp: number, xpPerLevel = 1000): number {
  return xpPerLevel - (xp % xpPerLevel);
}

export function levelProgress(xp: number, xpPerLevel = 1000): number {
  return (xp % xpPerLevel) / xpPerLevel;
}

export function rarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: "text-zinc-400",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-yellow-400",
  };
  return map[rarity] ?? "text-zinc-400";
}

export function rarityBorder(rarity: string): string {
  const map: Record<string, string> = {
    common: "border-zinc-600",
    uncommon: "border-green-500/50",
    rare: "border-blue-500/50",
    epic: "border-purple-500/50",
    legendary: "border-yellow-500/50",
  };
  return map[rarity] ?? "border-zinc-600";
}

export function gameColor(gameId: string): string {
  const map: Record<string, string> = {
    "rune-arena": "#F97373",
    "chain-farm": "#65D46E",
    "void-run": "#8B5CF6",
    ecosystem: "#F6C85F",
  };
  return map[gameId] ?? "#38D9F8";
}

export function gameLabel(gameId: string): string {
  const map: Record<string, string> = {
    "rune-arena": "RuneArena",
    "chain-farm": "ChainFarm",
    "void-run": "VoidRun",
    ecosystem: "Ecosystem",
  };
  return map[gameId] ?? gameId;
}

export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
