import { useEffect, useState } from "react";

function fmt(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const parts = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return ms >= 0 ? { text: `Due in ${parts}`, overdue: false } : { text: `Overdue by ${parts}`, overdue: true };
}

export function Countdown({ deadline, terminal }: { deadline: string; terminal?: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (terminal) return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [terminal]);
  if (!deadline) return null;
  const { text, overdue } = fmt(deadline);
  return (
    <span
      className="font-mono text-[12px]"
      style={{ color: terminal ? "rgba(255,255,255,0.4)" : overdue ? "rgb(248,113,113)" : "rgba(255,255,255,0.7)" }}
    >
      {text}
    </span>
  );
}
