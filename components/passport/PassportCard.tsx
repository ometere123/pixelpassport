import type { Passport } from "@/types";
import { shortAddress } from "@/lib/utils/cn";

interface PassportCardProps {
  passport: Passport;
}

export function PassportCard({ passport }: PassportCardProps) {
  return (
    <div
      className="rounded-2xl p-6 border pulse-gold relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--surface) 0%, rgba(246,200,95,0.05) 100%)",
        borderColor: "rgba(246,200,95,0.3)",
      }}
    >
      {/* Corner decorations */}
      <div
        className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2"
        style={{ borderColor: "var(--passport-gold)" }}
      />
      <div
        className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2"
        style={{ borderColor: "var(--passport-gold)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2"
        style={{ borderColor: "var(--passport-gold)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2"
        style={{ borderColor: "var(--passport-gold)" }}
      />

      {/* Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
          style={{
            background: "var(--surface-soft)",
            borderColor: "rgba(246,200,95,0.2)",
          }}
        >
          {passport.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={passport.avatar_url}
              alt={passport.username}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            "🧙"
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-mono mb-1" style={{ color: "var(--passport-gold)" }}>
            PASSPORT
          </div>
          <div className="font-bold text-lg leading-tight truncate">{passport.username}</div>
          <div className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
            {shortAddress(passport.owner)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Level</div>
          <div className="text-lg font-bold" style={{ color: "var(--passport-gold)" }}>
            {passport.level}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>XP</div>
          <div className="text-lg font-bold" style={{ color: "var(--xp-blue)" }}>
            {passport.ecosystem_xp.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Rep</div>
          <div className="text-lg font-bold" style={{ color: "var(--farm-green)" }}>
            {passport.reputation}
          </div>
        </div>
      </div>

      {/* Passport ID */}
      <div
        className="mt-4 pt-4 border-t text-xs font-mono"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        {passport.id}
      </div>
    </div>
  );
}
