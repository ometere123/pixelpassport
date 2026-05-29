import { GovernanceDashboard } from "@/components/governance/GovernanceDashboard";

export default function GovernancePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-4 border"
          style={{ borderColor: "rgba(246,200,95,0.3)", color: "var(--passport-gold)", background: "rgba(246,200,95,0.08)" }}>
          Coming Soon — MVP Skeleton
        </div>
        <h1 className="text-3xl font-bold mb-2">Ecosystem Governance</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The community governs which games join the ecosystem, which item classes are approved,
          and how translation rules evolve. Powered by EcosystemGovernance.py on GenLayer.
        </p>
      </div>
      <GovernanceDashboard />
    </div>
  );
}
