"use client";
import { levelProgress, xpToNextLevel } from "@/lib/utils/cn";

interface EcosystemXPBarProps {
  xp: number;
  level: number;
}

export function EcosystemXPBar({ xp, level }: EcosystemXPBarProps) {
  const pct = Math.min(1, levelProgress(xp)) * 100;
  const toNext = xpToNextLevel(xp);

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          Ecosystem Level {level}
        </span>
        <span className="text-xs font-mono" style={{ color: "var(--xp-blue)" }}>
          {toNext} XP to next level
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "var(--surface-soft)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--xp-blue), var(--pixel-cyan))",
          }}
        />
      </div>
      <div className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>
        {xp.toLocaleString()} XP total
      </div>
    </div>
  );
}
