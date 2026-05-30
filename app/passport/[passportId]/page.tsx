import { createAdminClient } from "@/lib/supabase/admin";
import { PassportCard } from "@/components/passport/PassportCard";
import { EcosystemXPBar } from "@/components/passport/EcosystemXPBar";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { GenLayerProofPanel } from "@/components/proof/GenLayerProofPanel";
import { PassportHologram } from "@/components/3d/PassportHologram";
import type { Passport, Achievement, ActivityEntry } from "@/types";

interface PageProps {
  params: Promise<{ passportId: string }>;
}

async function getPassportData(passportId: string) {
  try {
    const db = createAdminClient();
    const [passportRes, achievementsRes, activityRes] = await Promise.all([
      db.from("passports").select("*").eq("id", passportId).single(),
      db.from("achievements").select("*").eq("passport_id", passportId).order("unlocked_at", { ascending: false }),
      db.from("activity_feed").select("*").eq("passport_id", passportId).order("created_at", { ascending: false }).limit(10),
    ]);
    return {
      passport: passportRes.data as Passport | null,
      achievements: (achievementsRes.data ?? []) as Achievement[],
      activity: (activityRes.data ?? []) as ActivityEntry[],
    };
  } catch {
    return { passport: null, achievements: [], activity: [] };
  }
}

export default async function PassportProfilePage({ params }: PageProps) {
  const { passportId } = await params;
  const { passport, achievements, activity } = await getPassportData(passportId);

  if (!passport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🪪</div>
          <h1 className="text-xl font-bold mb-2">Passport Not Found</h1>
          <p style={{ color: "var(--text-muted)" }}>
            This passport does not exist in the registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: passport card */}
        <div className="lg:col-span-1 space-y-4">
          <PassportHologram passport={passport} height={260} />
          <PassportCard passport={passport} />
          <EcosystemXPBar xp={passport.ecosystem_xp} level={passport.level} />
          <GenLayerProofPanel
            contract="PassportRegistry"
            action="get_passport"
            recordId={passport.id}
          />
        </div>

        {/* Right column: achievements + activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Achievements */}
          <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="font-bold mb-4 flex items-center gap-2">
              🏆 <span>Achievements</span>
              <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {achievements.length} earned
              </span>
            </h2>
            {achievements.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No achievements yet. Start playing to earn them.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map((ach) => (
                  <AchievementBadge key={ach.id} achievement={ach} />
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="rounded-xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="font-bold mb-4">Recent Activity</h2>
            <ActivityFeed entries={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
