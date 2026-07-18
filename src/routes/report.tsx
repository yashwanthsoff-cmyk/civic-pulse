import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, MapPin, Loader2, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { submitComplaint } from "@/api/complaints";
import { getSessionId } from "@/lib/session";
import { ClientOnly } from "@/components/nagar/ClientOnly";
import { LeafletMap } from "@/components/nagar/LeafletMap";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a problem — NagarSeva" },
      { name: "description", content: "File a civic complaint with photo and GPS in under a minute." },
      { property: "og:title", content: "Report a problem — NagarSeva" },
      { property: "og:description", content: "Photo, location, done. Auto-routed and time-tracked." },
    ],
  }),
  component: ReportPage,
});

const CATEGORIES = [
  { v: "Pothole", i: "🕳️" },
  { v: "Streetlight Outage", i: "💡" },
  { v: "Garbage/Sanitation", i: "🗑️" },
  { v: "Blocked Drain", i: "🌊" },
  { v: "Unsafe Area/Poor Lighting", i: "🌙" },
  { v: "Encroachment", i: "🚧" },
  { v: "Other", i: "•" },
];

type GeoState =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "ok"; lat: number; lng: number; accuracy: number }
  | { kind: "manual"; lat: number; lng: number }
  | { kind: "error"; message: string };

async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function ReportPage() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });
  const [showMap, setShowMap] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    complaintId: string; department: string; slaDeadline: string; routingExplanation: string;
  }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeo({ kind: "error", message: "Your browser doesn't support location." });
      setShowMap(true);
      return;
    }
    setGeo({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ kind: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        setGeo({ kind: "error", message: err.message || "Location unavailable." });
        setShowMap(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setCompressing(true);
    try {
      const b64 = await compressImage(file);
      setPhoto(b64);
    } catch {
      toast.error("Couldn't read that image. Try another.");
    } finally {
      setCompressing(false);
    }
  }, []);

  const coords =
    geo.kind === "ok" || geo.kind === "manual" ? { lat: geo.lat, lng: geo.lng } : null;

  const canSubmit = !!photo && !!coords && !!category && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !photo || !coords) return;
    setSubmitting(true); setError(null);
    try {
      const res = await submitComplaint({
        photoBase64: photo,
        latitude: coords.lat,
        longitude: coords.lng,
        category,
        description: description || undefined,
        sessionId: getSessionId(),
      });
      setSuccess(res);
    } catch (err: any) {
      setError("That didn't go through. Your report wasn't saved — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const dl = new Date(success.slaDeadline);
    const dueDays = Math.max(0, Math.round((dl.getTime() - Date.now()) / 86400000));
    return (
      <main className="px-6 md:px-10 py-16 md:py-24">
        <div className="mx-auto max-w-[640px]">
          <div className="glass-card p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.4)" }}>
                <CheckCircle2 className="h-5 w-5 text-[rgb(74,222,128)]" />
              </div>
              <div>
                <div className="eyebrow">Filed</div>
                <div className="text-[13px] text-white/55 font-mono">#{success.complaintId.slice(0, 8)}</div>
              </div>
            </div>

            <h2 className="mt-8 text-[28px] font-semibold tracking-tight">Your report is on record.</h2>

            <div className="mt-8 space-y-5">
              <div>
                <div className="eyebrow mb-2">Routed to</div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg px-3 py-1.5 text-[14px] font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {success.department}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono text-white/70" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Sparkles className="h-3 w-3" /> Routed by AI
                  </span>
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">Deadline</div>
                <div className="text-[15px]">
                  {dl.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  <span className="ml-2 text-white/50 font-mono text-[13px]">Due in {dueDays}d</span>
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">Why this routing</div>
                <p className="text-[14px] leading-relaxed text-white/70">{success.routingExplanation}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => navigate({ to: "/my-reports" })}>Track this report</button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setSuccess(null); setPhoto(null); setCategory(""); setDescription("");
                }}
              >File another</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-10 py-16 md:py-24">
      <div className="mx-auto max-w-[640px]">
        <div className="eyebrow mb-5">New report</div>
        <h1 className="section-heading">What's wrong, and where?</h1>
        <p className="mt-6 text-[15px] text-white/55">
          Takes about a minute. You'll get a tracking link and a deadline once it's filed.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          {/* Photo */}
          <div>
            <div className="eyebrow mb-3">Photo</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {!photo && !compressing && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="glass-card flex w-full flex-col items-center justify-center gap-3 p-10 text-center transition-colors hover:!border-white/20"
              >
                <Camera className="h-6 w-6 text-white/60" />
                <div className="text-[15px] font-medium">Take a photo</div>
                <div className="text-[13px] text-white/50">Tap to open camera or choose from gallery</div>
              </button>
            )}
            {compressing && (
              <div className="glass-card flex items-center justify-center gap-3 p-10 text-[14px] text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Optimizing photo…
              </div>
            )}
            {photo && !compressing && (
              <div className="glass-card overflow-hidden p-2">
                <img src={photo} alt="Report" className="max-h-[360px] w-full rounded-[14px] object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); fileRef.current?.click(); }}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-[13px] text-white/70 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retake / choose different photo
                </button>
              </div>
            )}
            {!photo && !compressing && (
              <p className="mt-2 text-[12px] text-white/40">Add a photo to continue.</p>
            )}
          </div>

          {/* Location */}
          <div>
            <div className="eyebrow mb-3">Location</div>
            <div className="glass-card p-4">
              {geo.kind === "locating" && (
                <div className="flex items-center gap-2 text-[14px] text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Locating you…
                </div>
              )}
              {geo.kind === "ok" && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-[rgb(74,222,128)]" />
                  <div className="flex-1">
                    <div className="text-[14px]">
                      Location detected <span className="text-[rgb(74,222,128)]">✓</span>
                      <span className="ml-2 font-mono text-[12px] text-white/50">±{Math.round(geo.accuracy)}m</span>
                    </div>
                    <button type="button" onClick={() => setShowMap((s) => !s)} className="mt-1 text-[13px] text-white/60 underline underline-offset-2 hover:text-white">
                      {showMap ? "Hide map" : "Adjust pin on map"}
                    </button>
                  </div>
                </div>
              )}
              {geo.kind === "manual" && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-[rgb(251,191,36)]" />
                  <div className="flex-1 text-[14px]">Pin placed manually. Drag it to adjust.</div>
                </div>
              )}
              {geo.kind === "error" && (
                <div className="text-[14px]">
                  <div className="text-[rgb(248,113,113)]">Couldn't get your location automatically.</div>
                  <div className="mt-1 text-[13px] text-white/60">Place your pin on the map below to continue.</div>
                </div>
              )}
            </div>

            {(showMap || geo.kind === "error") && (
              <div className="mt-3">
                <ClientOnly fallback={<div className="glass-card h-[300px]" />}>
                  <LeafletMap
                    height={300}
                    center={coords ? [coords.lat, coords.lng] : [20.5937, 78.9629]}
                    zoom={coords ? 16 : 5}
                    pin={coords ?? undefined}
                    draggablePin
                    onPinChange={(lat, lng) => setGeo({ kind: "manual", lat, lng })}
                  />
                </ClientOnly>
                {!coords && (
                  <p className="mt-2 text-[12px] text-white/40">Tap and drag the pin to your location.</p>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <div className="eyebrow mb-3">Category</div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCategory(c.v)}
                  className="flex items-center gap-2 rounded-[14px] px-3 py-3 text-left text-[13px] transition-colors"
                  style={{
                    background: category === c.v ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${category === c.v ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <span className="text-[16px]">{c.i}</span>
                  <span>{c.v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="eyebrow mb-3">Detail (optional)</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Add any detail that helps (e.g. 'blocking the footpath', 'been dark for 3 nights')"
              className="w-full resize-none rounded-[14px] bg-white/[0.03] px-4 py-3 text-[14px] outline-none placeholder:text-white/30"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <div className="mt-1 text-right font-mono text-[11px] text-white/40">{description.length}/300</div>
          </div>

          {error && (
            <div className="rounded-[14px] p-4 text-[14px]" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)", color: "rgb(248,113,113)" }}>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link to="/" className="text-[13px] text-white/50 hover:text-white">← Cancel</Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Filing your report…</>) : "File report →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
