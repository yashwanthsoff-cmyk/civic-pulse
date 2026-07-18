import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 50);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,10,0.90)" : "rgba(10,10,10,0)",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
        <Link to="/" className="text-[18px] font-extrabold tracking-tight">
          NagarSeva
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[14px] text-white/60">
          <Link to="/report" activeProps={{ className: "text-white" }} className="hover:text-white transition-colors">Report</Link>
          <Link to="/my-reports" activeProps={{ className: "text-white" }} className="hover:text-white transition-colors">My Reports</Link>
          <Link to="/wards" activeProps={{ className: "text-white" }} className="hover:text-white transition-colors">Ward Accountability</Link>
          <Link to="/heatmap" activeProps={{ className: "text-white" }} className="hover:text-white transition-colors">Heatmap</Link>
        </div>
        <Link to="/report" className="btn-primary !py-2 !px-5 text-[14px]">Report a Problem</Link>
      </div>
    </nav>
  );
}
