import { createAdminClient } from "@/lib/supabase/admin";
import { LeaderboardTable } from "@/components/ui/LeaderboardTable";
import type { LeaderboardEntry } from "@/types";

async function getLeaderboard() {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("passports")
      .select("id, username, avatar_url, ecosystem_xp")
      .order("ecosystem_xp", { ascending: false })
      .limit(20);

    const entries: LeaderboardEntry[] = (data ?? []).map((p, i) => ({
      rank: i + 1,
      passport_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      score: p.ecosystem_xp,
      game_id: "ecosystem",
    }));
    return entries;
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Ecosystem XP ranking across all worlds.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span style={{ color: "var(--passport-gold)" }}>🏆</span> Ecosystem XP
          </h2>
          {entries.length === 0 ? (
            <div className="rounded-xl p-8 text-center border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                No players yet. Create a passport and start playing!
              </p>
            </div>
          ) : (
            <LeaderboardTable entries={entries} gameId="ecosystem" />
          )}
        </div>
      </div>
    </div>
  );
}
