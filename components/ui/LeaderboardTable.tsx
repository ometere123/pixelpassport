import type { LeaderboardEntry } from "@/types";
import { shortAddress, gameColor } from "@/lib/utils/cn";
import Link from "next/link";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  gameId: string;
}

export function LeaderboardTable({ entries, gameId }: LeaderboardTableProps) {
  const color = gameColor(gameId);

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--border)" }}>
            <th className="px-4 py-3 text-left text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Player
            </th>
            <th className="px-4 py-3 text-right text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.passport_id}
              className="border-t"
              style={{
                background: i % 2 === 0 ? "var(--surface)" : "var(--surface-soft)",
                borderColor: "var(--border)",
              }}
            >
              <td className="px-4 py-3">
                <span className="font-mono font-bold" style={{ color: entry.rank <= 3 ? color : "var(--text-muted)" }}>
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link href={`/passport/${entry.passport_id}`} className="hover:underline font-medium">
                  {entry.username}
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono" style={{ color }}>
                {entry.score.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
