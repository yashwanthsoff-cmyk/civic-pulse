import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, BarChart3 } from "lucide-react";
import { getWardScores, type WardScore } from "@/api/wards";

export const Route = createFileRoute("/wards")({
  head: () => ({
    meta: [
      { title: "Ward accountability — NagarSeva" },
      { name: "description", content: "Public accountability scores for every ward. No login, no filler numbers." },
      { property: "og:title", content: "Ward accountability — NagarSeva" },
      { property: "og:description", content: "Real scores from real reports. Public by design." },
    ],
  }),
  component: Wards,
});

type S =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "ok"; wards: WardScore[]; cityWideScore: number | null; totalCurrentlyEscalated: number }
  | { kind: "error" };

function scoreColor(s: number | null) {
  if (s === null) return { c: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)" };
  if (s >= 80) return { c: "rgb(74,222,128)", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.35)" };
  if (s >= 50) return { c: "rgb(251,191,36)", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.35)" };
  return { c: "rgb(248,113,113)", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)" };
}

function Wards() {
  const [s, setS] = useState<S>({ kind: "loading" });
  const load = () => {
    setS({ kind: "loading" });
    getWardScores()
      .then((r) => setS(r.wards.length ? { kind: "ok", ...r } : { kind: "empty" }))
      .catch(() => setS({ kind: "error" }));
  };
  useEffect(load, []);

  return (
    <main className="px-6 md:px-10 py-16 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <div className="eyebrow mb-4">Public accountability</div>
        <h1 className="section-heading max-w-3xl">Ward accountability, in the open.</h1>
        <p className="mt-6 max-w-2xl text-[15px] text-white/55">
          Every score below is calculated from real complaints filed on this platform. No default values, no filler.
        </p>

        <div className="mt-12">
          {s.kind === "loading" && (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="glass-card h-16 animate-pulse" style={{ opacity: 0.4 }} />)}
            </div>
          )}
          {s.kind === "error" && (
            <div className="glass-card p-8">
              <div className="text-[15px] font-medium text-[rgb(248,113,113)]">Couldn't load ward scores.</div>
              <button onClick={load} className="mt-4 btn-ghost !py-2 !px-4 text-[13px]"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
            </div>
          )}
          {s.kind === "empty" && (
            <div className="glass-card flex flex-col items-center gap-3 p-16 text-center">
              <BarChart3 className="h-6 w-6 text-white/50" />
              <div className="text-[18px] font-semibold">No reports have been filed yet.</div>
              <div className="text-[14px] text-white/55">Ward scores will appear here as reports come in.</div>
            </div>
          )}
          {s.kind === "ok" && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="glass-card p-6">
                  <div className="eyebrow mb-2">City-wide score</div>
                  <div className="text-[48px] font-bold tracking-tight leading-none">
                    {s.cityWideScore === null ? <span className="text-white/40 text-[24px]">No data yet</span> : s.cityWideScore.toFixed(0)}
                  </div>
                </div>
                <div className="glass-card p-6">
                  <div className="eyebrow mb-2">Currently escalated</div>
                  <div className="text-[48px] font-bold tracking-tight leading-none text-[rgb(248,113,113)]">{s.totalCurrentlyEscalated}</div>
                </div>
                <div className="glass-card p-6">
                  <div className="eyebrow mb-2">Wards tracked</div>
                  <div className="text-[48px] font-bold tracking-tight leading-none">{s.wards.length}</div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[20px]" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] font-mono uppercase tracking-widest text-white/40" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="col-span-3">Ward</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-2 text-right">On-time</div>
                  <div className="col-span-2 text-right">Escalated</div>
                  <div className="col-span-1 text-right">Overdue</div>
                  <div className="col-span-2 text-right">Score</div>
                </div>
                {s.wards.map((w) => {
                  const sc = scoreColor(w.accountabilityScore);
                  return (
                    <div key={w.ward} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 text-[14px]" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="md:col-span-3 font-medium">{w.ward}</div>
                      <div className="md:col-span-2 md:text-right"><span className="md:hidden text-white/40 text-[12px] mr-2">Total</span>{w.totalComplaints}</div>
                      <div className="md:col-span-2 md:text-right"><span className="md:hidden text-white/40 text-[12px] mr-2">On-time</span>{w.resolvedOnTime}</div>
                      <div className="md:col-span-2 md:text-right"><span className="md:hidden text-white/40 text-[12px] mr-2">Escalated</span><span style={{ color: w.escalated > 0 ? "rgb(248,113,113)" : undefined }}>{w.escalated}</span></div>
                      <div className="md:col-span-1 md:text-right text-white/60"><span className="md:hidden text-white/40 text-[12px] mr-2">Overdue</span>{w.avgOverdueDays === null ? "—" : `${w.avgOverdueDays.toFixed(1)}d`}</div>
                      <div className="md:col-span-2 md:text-right">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-mono font-semibold" style={{ color: sc.c, background: sc.bg, border: `1px solid ${sc.border}` }}>
                          {w.accountabilityScore === null ? "No data yet" : w.accountabilityScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
