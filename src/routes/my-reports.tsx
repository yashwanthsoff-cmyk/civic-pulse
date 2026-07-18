import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Inbox, Sparkles, RefreshCw, ArrowLeft, FastForward } from "lucide-react";
import { listComplaints, getComplaint, type Complaint, type ComplaintStatus } from "@/api/complaints";
import { fastForwardComplaint } from "@/api/demo";
import { getSessionId } from "@/lib/session";
import { StatusBadge } from "@/components/nagar/StatusBadge";
import { Countdown } from "@/components/nagar/Countdown";
import { ClientOnly } from "@/components/nagar/ClientOnly";
import { LeafletMap } from "@/components/nagar/LeafletMap";

type Search = { id?: string; demo?: "1" };

export const Route = createFileRoute("/my-reports")({
  head: () => ({
    meta: [
      { title: "My reports — NagarSeva" },
      { name: "description", content: "Track every complaint you've filed. Live SLA, auto-escalation, real timestamps." },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): Search => ({
    id: typeof raw.id === "string" ? raw.id : undefined,
    demo: raw.demo === "1" ? "1" : undefined,
  }),
  component: MyReports,
});

function MyReports() {
  const { id } = Route.useSearch();
  return id ? <Detail complaintId={id} /> : <List />;
}

function List() {
  const navigate = useNavigate();
  const { demo } = Route.useSearch();
  const demoOn = demo === "1";
  const [state, setState] = useState<{ kind: "loading" } | { kind: "empty" } | { kind: "ok"; items: Complaint[] } | { kind: "error"; msg: string }>({ kind: "loading" });

  const load = () => {
    setState({ kind: "loading" });
    listComplaints(getSessionId())
      .then((items) => setState(items.length ? { kind: "ok", items } : { kind: "empty" }))
      .catch(() => setState({ kind: "error", msg: "We couldn't load your reports right now." }));
  };
  useEffect(load, []);

  return (
    <main className="px-6 md:px-10 py-16 md:py-20">
      <div className="mx-auto max-w-[880px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Your reports</div>
            <h1 className="section-heading">My reports.</h1>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[12px] font-mono" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <input
              type="checkbox"
              checked={demoOn}
              onChange={(e) => navigate({ to: "/my-reports", search: (p: any) => ({ ...p, demo: e.target.checked ? "1" : undefined }) })}
              className="accent-white"
            />
            Demo mode
          </label>
        </div>

        <div className="mt-10">
          {state.kind === "loading" && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass-card h-24 animate-pulse" style={{ opacity: 0.5 }} />
              ))}
            </div>
          )}

          {state.kind === "empty" && (
            <div className="glass-card flex flex-col items-center gap-4 p-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Inbox className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <div className="text-[18px] font-semibold">You haven't filed a report yet.</div>
                <div className="mt-1 text-[14px] text-white/55">When you do, it'll show up here with a live SLA.</div>
              </div>
              <Link to="/report" className="btn-primary">File your first report</Link>
            </div>
          )}

          {state.kind === "error" && (
            <div className="glass-card p-8">
              <div className="text-[15px] font-medium text-[rgb(248,113,113)]">Couldn't load your reports.</div>
              <div className="mt-1 text-[13px] text-white/55">{state.msg}</div>
              <button onClick={load} className="mt-4 btn-ghost !py-2 !px-4 text-[13px]"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
            </div>
          )}

          {state.kind === "ok" && (
            <div className="space-y-3">
              {state.items.map((c) => (
                <button
                  key={c.complaintId}
                  onClick={() => navigate({ to: "/my-reports", search: (p: any) => ({ ...p, id: c.complaintId }) })}
                  className="glass-card glass-card-hover flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} />
                      <span className="font-mono text-[11px] text-white/40">#{c.complaintId.slice(0, 8)}</span>
                    </div>
                    <div className="mt-3 text-[15px] font-medium">{c.category}</div>
                    {c.description && (
                      <div className="mt-1 line-clamp-1 text-[13px] text-white/55">{c.description}</div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[12px] text-white/45">
                      <span>{c.department}</span>
                      <span>·</span>
                      <Countdown deadline={c.slaDeadline} terminal={c.status === "RESOLVED" || c.status === "ESCALATED"} />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const STEPS: ComplaintStatus[] = ["SUBMITTED", "IN_PROGRESS", "ESCALATED", "RESOLVED"];

function stepIndex(status: ComplaintStatus, c: Complaint): number {
  if (status === "SUBMITTED") return 0;
  if (status === "IN_PROGRESS") return 1;
  if (status === "ESCALATED") return 2;
  return c.escalatedAt ? 3 : 3; // RESOLVED
}

function Detail({ complaintId }: { complaintId: string }) {
  const { demo } = Route.useSearch();
  const demoOn = demo === "1";
  const navigate = useNavigate();
  const [state, setState] = useState<{ kind: "loading" } | { kind: "ok"; c: Complaint } | { kind: "missing" } | { kind: "error" }>({ kind: "loading" });

  const load = async () => {
    try {
      const c = await getComplaint(complaintId);
      setState(c ? { kind: "ok", c } : { kind: "missing" });
    } catch {
      setState({ kind: "error" });
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [complaintId]);

  // 30s polling while tab visible
  useEffect(() => {
    let id: number | null = null;
    const start = () => {
      stop();
      id = window.setInterval(load, 30_000) as unknown as number;
    };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    const vis = () => document.visibilityState === "visible" ? start() : stop();
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); document.removeEventListener("visibilitychange", vis); };
    // eslint-disable-next-line
  }, [complaintId]);

  return (
    <main className="px-6 md:px-10 py-12 md:py-16">
      <div className="mx-auto max-w-[880px]">
        <button
          onClick={() => navigate({ to: "/my-reports", search: (p: any) => ({ ...p, id: undefined }) })}
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-white/55 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> All reports
        </button>

        {state.kind === "loading" && <div className="glass-card h-[400px] animate-pulse" style={{ opacity: 0.5 }} />}
        {state.kind === "error" && (
          <div className="glass-card p-8">
            <div className="text-[15px] font-medium text-[rgb(248,113,113)]">Couldn't load this report.</div>
            <button onClick={load} className="mt-4 btn-ghost !py-2 !px-4 text-[13px]"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
          </div>
        )}
        {state.kind === "missing" && (
          <div className="glass-card p-10 text-center">
            <div className="text-[18px] font-semibold">Report not found.</div>
            <div className="mt-2 text-[13px] text-white/55">It may have been removed or doesn't belong to this browser session.</div>
          </div>
        )}
        {state.kind === "ok" && <DetailBody c={state.c} demoOn={demoOn} onChanged={load} />}
      </div>
    </main>
  );
}

function DetailBody({ c, demoOn, onChanged }: { c: Complaint; demoOn: boolean; onChanged: () => void }) {
  const active = stepIndex(c.status, c);
  const terminal = c.status === "RESOLVED" || c.status === "ESCALATED";
  const escalated = !!c.escalatedAt || c.status === "ESCALATED";

  const nodeColor = (i: number): string => {
    if (i === 3 && c.status === "RESOLVED") return "rgb(74,222,128)";
    if (i === 2 && escalated) return "rgb(248,113,113)";
    if (i <= active) return "#ffffff";
    return "rgba(255,255,255,0.2)";
  };
  const stepTimes: Array<string | null> = [
    c.submittedAt,
    c.status === "IN_PROGRESS" || c.status === "ESCALATED" || c.status === "RESOLVED" ? c.submittedAt : null,
    c.escalatedAt,
    c.resolvedAt,
  ];

  async function ff() {
    const key = (import.meta as any).env?.VITE_DEMO_KEY || "";
    try {
      await fastForwardComplaint(c.complaintId, key);
      toast.success("SLA deadline moved up — escalation will fire on the next check");
      onChanged();
    } catch (e: any) {
      if (String(e?.message || "").includes("401")) toast.error("Demo key not configured");
      else toast.error("Couldn't fast-forward this complaint.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <StatusBadge status={c.status} />
          <span className="font-mono text-[11px] text-white/40">#{c.complaintId.slice(0, 8)}</span>
        </div>
        <h1 className="mt-4 text-[32px] font-semibold tracking-tight md:text-[40px]">{c.category}</h1>
        {c.description && <p className="mt-3 text-[15px] leading-relaxed text-white/70">{c.description}</p>}
      </div>

      {/* Timeline */}
      <div className="glass-card p-6 md:p-8">
        <div className="eyebrow mb-6">Progress</div>

        {/* Desktop horizontal */}
        <div className="hidden md:block">
          <div className="flex items-start">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-start">
                <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
                  <div
                    className={i === active && !terminal ? "status-pulse" : ""}
                    style={{
                      width: 14, height: 14, borderRadius: 999,
                      background: i <= active ? nodeColor(i) : "transparent",
                      border: `2px solid ${nodeColor(i)}`,
                      color: nodeColor(i),
                    }}
                  />
                  <div className="mt-3 text-center text-[12px] font-medium" style={{ color: i <= active ? "#fff" : "rgba(255,255,255,0.3)" }}>
                    {s.replace("_", " ")}
                  </div>
                  {stepTimes[i] && (
                    <div className="mt-1 font-mono text-[10px] text-white/40">
                      {new Date(stepTimes[i]!).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </div>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="mt-[6px] h-[2px] flex-1"
                    style={{
                      background: i < active
                        ? (i === 1 && escalated ? "rgb(248,113,113)" : "#ffffff")
                        : "rgba(255,255,255,0.12)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile vertical */}
        <div className="md:hidden space-y-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-start gap-4">
              <div
                className={i === active && !terminal ? "status-pulse" : ""}
                style={{
                  width: 14, height: 14, borderRadius: 999, marginTop: 4,
                  background: i <= active ? nodeColor(i) : "transparent",
                  border: `2px solid ${nodeColor(i)}`,
                  color: nodeColor(i),
                }}
              />
              <div>
                <div className="text-[13px] font-medium" style={{ color: i <= active ? "#fff" : "rgba(255,255,255,0.3)" }}>{s.replace("_", " ")}</div>
                {stepTimes[i] && <div className="font-mono text-[11px] text-white/45">{new Date(stepTimes[i]!).toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <div>
            <div className="eyebrow mb-1">SLA</div>
            <Countdown deadline={c.slaDeadline} terminal={terminal} />
          </div>
          {demoOn && !terminal && (
            <button onClick={ff} className="btn-ghost !py-2 !px-4 text-[13px]">
              <FastForward className="h-3.5 w-3.5" /> Fast-forward SLA (demo)
            </button>
          )}
        </div>
      </div>

      {escalated && c.escalationNote && (
        <div className="rounded-[20px] p-6" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)" }}>
          <div className="eyebrow mb-2" style={{ color: "rgb(248,113,113)" }}>Escalated</div>
          <p className="text-[14px] leading-relaxed text-white/85">{c.escalationNote}</p>
        </div>
      )}
      {c.resolvedAt && (
        <div className="rounded-[20px] p-6" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.35)" }}>
          <div className="eyebrow mb-1" style={{ color: "rgb(74,222,128)" }}>Resolved</div>
          <p className="text-[14px] text-white/85">Resolved on {new Date(c.resolvedAt).toLocaleString()}</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {c.photoUrl && (
          <div className="glass-card overflow-hidden p-2">
            <img src={c.photoUrl} alt="Report" className="h-[240px] w-full rounded-[14px] object-cover" />
          </div>
        )}
        <div className="glass-card overflow-hidden p-2">
          <ClientOnly fallback={<div style={{ height: 240 }} />}>
            <LeafletMap
              height={240}
              center={[c.latitude, c.longitude]}
              zoom={15}
              pin={{ lat: c.latitude, lng: c.longitude }}
              interactive={false}
            />
          </ClientOnly>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2">
          <div className="eyebrow">Department</div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono text-white/70" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Sparkles className="h-3 w-3" /> Routed by AI
          </span>
        </div>
        <div className="mt-2 text-[15px] font-medium">{c.department}</div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">{c.routingExplanation}</p>
      </div>
    </div>
  );
}
