import type { ComplaintStatus } from "@/api/complaints";

const map: Record<ComplaintStatus, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED: { label: "Submitted", color: "rgba(255,255,255,0.72)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.16)" },
  IN_PROGRESS: { label: "In progress", color: "rgb(251,191,36)", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.35)" },
  ESCALATED: { label: "Escalated", color: "rgb(248,113,113)", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.35)" },
  RESOLVED: { label: "Resolved", color: "rgb(74,222,128)", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.35)" },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
