import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Globe, RefreshCw } from "lucide-react";
import { getHeatmap } from "@/api/heatmap";
import { ClientOnly } from "@/components/nagar/ClientOnly";
import { LeafletMap } from "@/components/nagar/LeafletMap";

export const Route = createFileRoute("/heatmap")({
  head: () => ({
    meta: [
      { title: "Safety heatmap — NagarSeva" },
      { name: "description", content: "Real reports plotted by location and time of day. No simulated points." },
      { property: "og:title", content: "Safety heatmap — NagarSeva" },
      { property: "og:description", content: "Where it doesn't feel safe — real data, honest empty states." },
    ],
  }),
  component: Heat,
});

type TOD = "all" | "day" | "night";
type Cat = "all" | "Unsafe Area/Poor Lighting" | "Streetlight Outage";
type S = { kind: "loading" } | { kind: "ok"; points: Array<[number, number, number]>; total: number } | { kind: "empty" } | { kind: "error" };

const CATEGORY_GRADIENTS: Record<Cat, Record<number, string>> = {
  all: { 0.1: "#4ade80", 0.4: "#fbbf24", 0.7: "#f87171", 1.0: "#ffffff" },
  "Unsafe Area/Poor Lighting": { 0.1: "#c084fc", 0.4: "#a855f7", 0.7: "#7c3aed", 1.0: "#ffffff" },
  "Streetlight Outage": { 0.1: "#fde68a", 0.4: "#fbbf24", 0.7: "#f59e0b", 1.0: "#ffffff" },
};

const CATEGORY_LABELS: Record<Cat, string> = {
  all: "All types",
  "Unsafe Area/Poor Lighting": "Unsafe area",
  "Streetlight Outage": "Streetlight",
};

function Heat() {
  const [tod, setTod] = useState<TOD>("all");
  const [cat, setCat] = useState<Cat>("all");
  const [s, setS] = useState<S>({ kind: "loading" });

  const load = (t: TOD, c: Cat) => {
    setS({ kind: "loading" });
    getHeatmap(t, c)
      .then((r) => {
        if (!r.points.length) setS({ kind: "empty" });
        else setS({ kind: "ok", points: r.points.map((p) => [p.latitude, p.longitude, p.weight]), total: r.totalReports });
      })
      .catch(() => setS({ kind: "error" }));
  };
  useEffect(() => { load(tod, cat); }, [tod, cat]);

  const center: [number, number] = s.kind === "ok" && s.points.length
    ? [
        s.points.reduce((sum, p) => sum + p[0], 0) / s.points.length,
        s.points.reduce((sum, p) => sum + p[1], 0) / s.points.length,
      ]
    : [20.5937, 78.9629];

  const zoom = s.kind === "ok"
    ? (s.points.length <= 2 ? 16 : s.points.length <= 6 ? 13 : 12)
    : 12;

  return (
    <main className="px-6 md:px-10 py-16 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="eyebrow mb-4">Safety heatmap</div>
        <h1 className="section-heading max-w-3xl">Where it doesn't feel safe.</h1>
        <p className="mt-6 max-w-2xl text-[15px] text-white/55">
          Every point below is a real report. If a view is empty, it says so — no simulated hotspots.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-full p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {([["all", "All", Globe], ["day", "Day", Sun], ["night", "Night", Moon]] as const).map(([v, l, Ico]) => (
              <button
                key={v}
                onClick={() => setTod(v)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors"
                style={{
                  background: tod === v ? "#ffffff" : "transparent",
                  color: tod === v ? "#000" : "rgba(255,255,255,0.7)",
                }}
              >
                <Ico className="h-3.5 w-3.5" /> {l}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["all", "Unsafe Area/Poor Lighting", "Streetlight Outage"] as Cat[]).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors"
                style={{
                  background: cat === c ? "#ffffff" : "transparent",
                  color: cat === c ? "#000" : "rgba(255,255,255,0.7)",
                }}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {s.kind === "ok" && (
            <div className="font-mono text-[12px] text-white/50">{s.total} real reports in this view</div>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="glass-card overflow-hidden p-0" style={{ position: "relative" }}>
            {s.kind === "loading" && <div className="animate-pulse" style={{ height: 520, opacity: 0.4, background: "rgba(255,255,255,0.02)" }} />}
            {s.kind === "error" && (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="text-[15px] font-medium text-[rgb(248,113,113)]">Couldn't load the heatmap.</div>
                <button onClick={() => load(tod, cat)} className="btn-ghost !py-2 !px-4 text-[13px]"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
              </div>
            )}
            {s.kind === "empty" && (
              <div className="relative">
                <div style={{ height: 520, background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02), transparent 60%)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-card p-8 text-center max-w-sm">
                    <div className="text-[16px] font-semibold">No reports in this view yet.</div>
                    <div className="mt-2 text-[13px] text-white/55">As reports come in for the selected filters, they'll appear here.</div>
                    <div className="mt-3 font-mono text-[12px] text-white/40">Total reports: 0</div>
                  </div>
                </div>
              </div>
            )}
            {s.kind === "ok" && (
              <ClientOnly fallback={<div style={{ height: 520 }} />}>
                <LeafletMap
                  height={520}
                  center={center}
                  zoom={zoom}
                  heatPoints={s.points}
                  heatGradient={CATEGORY_GRADIENTS[cat]}
                />
              </ClientOnly>
            )}
          </div>

          <aside className="glass-card p-6">
            <div className="eyebrow mb-3">Why this matters</div>
            <p className="text-[14px] leading-relaxed text-white/75">
              A large share of people report feeling unsafe in public spaces after dark — and perception of safety
              drops sharply once the sun goes down.
            </p>
            <p className="mt-3 text-[12px] text-white/40">
              Source: NCW NARI 2025 report, 12,770 women surveyed across 31 Indian cities.
            </p>
            <div className="mt-6 border-t border-white/8 pt-4">
              <div className="eyebrow mb-2">Legend</div>
              <div className="flex items-center gap-3 text-[12px] text-white/60">
                <span
                  className="inline-block h-2 w-6 rounded-full"
                  style={{
                    background: cat === "all"
                      ? "linear-gradient(90deg, #4ade80, #fbbf24, #f87171, #fff)"
                      : cat === "Unsafe Area/Poor Lighting"
                        ? "linear-gradient(90deg, #c084fc, #a855f7, #7c3aed, #fff)"
                        : "linear-gradient(90deg, #fde68a, #fbbf24, #f59e0b, #fff)",
                  }}
                />
                <span>low → high density{cat !== "all" ? ` · ${CATEGORY_LABELS[cat]}` : ""}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}