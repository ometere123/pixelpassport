import type { Achievement } from "@/types";
import { rarityBorder, rarityColor } from "@/lib/utils/cn";

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-lg p-3 border text-center ${rarityBorder(achievement.rarity)}`}
      style={{ background: "var(--surface-soft)" }}
      title={achievement.description ?? ""}
    >
      <div className="text-2xl mb-1">{achievement.icon}</div>
      <div className={`text-xs font-semibold ${rarityColor(achievement.rarity)}`}>
        {achievement.name}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
        {achievement.game_id}
      </div>
    </div>
  );
}
