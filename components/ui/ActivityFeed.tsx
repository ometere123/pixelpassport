import type { ActivityEntry } from "@/types";
import { timeAgo, gameColor, gameLabel } from "@/lib/utils/cn";

const TYPE_ICONS: Record<string, string> = {
  item_earned: "⚔️",
  item_translated: "🔄",
  achievement_unlocked: "🏆",
  battle_won: "⚔️",
  crop_harvested: "🌾",
  puzzle_solved: "🧩",
  passport_created: "🪪",
  xp_gained: "✨",
};

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
        No activity yet. Start playing to see your journey here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{
              background: `${gameColor(entry.game_id)}15`,
              border: `1px solid ${gameColor(entry.game_id)}30`,
            }}
          >
            {TYPE_ICONS[entry.type] ?? "●"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{entry.title}</div>
            {entry.description && (
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {entry.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-mono"
                style={{ color: gameColor(entry.game_id) }}
              >
                {gameLabel(entry.game_id)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {timeAgo(entry.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
