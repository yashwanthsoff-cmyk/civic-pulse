import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center px-6 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="eyebrow mb-6">Civic complaints · public accountability</div>
          <h1 className="hero-heading">
            See something wrong.
            <br />
            Make it official.
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-[1.65] text-white/55">
            Photo, location, done. Every report is tracked, timed, and escalated automatically if it's ignored.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/report" className="btn-primary">Report a Problem →</Link>
            <Link to="/wards" className="btn-ghost">See Ward Scores</Link>
          </div>
          <div className="mt-16 font-mono text-[13px] text-white/40">
            Real reports. Real deadlines. Real ward scores.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-10 py-24 md:py-36">
        <div className="mx-auto max-w-[1200px]">
          <div className="eyebrow mb-5">How it works</div>
          <h2 className="section-heading max-w-3xl">Three steps between the pothole and the paperwork.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Snap & Submit", d: "Photo, GPS, and a category. Filed in under a minute from your phone." },
              { n: "02", t: "Auto-Routed", d: "AI reads the complaint and assigns the right department and deadline instantly — you see the routing decision." },
              { n: "03", t: "Escalates Itself", d: "If the deadline passes, the report escalates to the ward office automatically. No follow-up calls needed." },
            ].map((c) => (
              <div key={c.n} className="glass-card glass-card-hover p-8">
                <div className="font-mono text-[12px] tracking-[0.12em] text-white/40">{c.n}</div>
                <h3 className="mt-6 text-[22px] font-semibold tracking-tight">{c.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/55">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public by design */}
      <section className="px-6 md:px-10 py-24 md:py-36">
        <div className="mx-auto max-w-[1200px]">
          <div className="eyebrow mb-5">Public by design</div>
          <h2 className="section-heading max-w-3xl">Accountability people can actually see.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { t: "Public ward scores", d: "No login required to see how each ward is performing. The data is the whole point." },
              { t: "No fabricated numbers", d: "If a ward has no data yet, it says so — plainly. No default 100, no filler." },
              { t: "Real submissions only", d: "Every point on the heatmap is a report a real person filed. Nothing simulated." },
            ].map((c) => (
              <div key={c.t} className="glass-card p-8">
                <h3 className="text-[20px] font-semibold tracking-tight">{c.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/55">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-6 md:px-10 py-14">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6">
          <div className="text-[14px] font-extrabold tracking-tight">NagarSeva</div>
          <div className="flex flex-wrap gap-6 text-[13px] text-white/55">
            <Link to="/report">Report</Link>
            <Link to="/my-reports">My Reports</Link>
            <Link to="/wards">Ward Scores</Link>
            <Link to="/heatmap">Heatmap</Link>
          </div>
          <div className="text-[12px] text-white/30">© {new Date().getFullYear()} NagarSeva</div>
        </div>
      </footer>
    </main>
  );
}
