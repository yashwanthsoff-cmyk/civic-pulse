const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export async function fastForwardComplaint(complaintId: string, demoKey: string) {
  const res = await fetch(`${FUNCTIONS_BASE}/demo-fast-forward/${complaintId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      "x-demo-key": demoKey,
    },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<{ complaintId: string; newSlaDeadline: string }>;
}

export async function triggerEscalationSweep(cronSecret: string) {
  const res = await fetch(`${FUNCTIONS_BASE}/escalation-sweep`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      "x-cron-secret": cronSecret,
    },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<{ scanned: number; escalated: number }>;
}

export async function resolveComplaint(complaintId: string, demoKey: string) {
  const res = await fetch(`${FUNCTIONS_BASE}/resolve-complaint/${complaintId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ANON_KEY}`, "x-demo-key": demoKey },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<{ complaintId: string; status: string; resolvedAt: string }>;
}