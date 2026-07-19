import { request } from "./_client";

export type ComplaintStatus = "SUBMITTED" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED";

export type Complaint = {
  complaintId: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  ward: string;
  category: string;
  description: string | null;
  photoUrl: string;
  department: string;
  status: ComplaintStatus;
  submittedAt: string;
  slaDeadline: string;
  routingExplanation: string;
  escalatedAt: string | null;
  resolvedAt: string | null;
  escalationNote: string | null;
};

function mapComplaint(row: any): Complaint {
  return {
    complaintId: row.id,
    sessionId: row.session_id,
    latitude: row.latitude,
    longitude: row.longitude,
    ward: row.ward,
    category: row.category,
    description: row.description,
    photoUrl: row.photo_url,
    department: row.department,
    status: row.status,
    submittedAt: row.submitted_at,
    slaDeadline: row.sla_deadline,
    routingExplanation: row.routing_explanation,
    escalatedAt: row.escalated_at,
    resolvedAt: row.resolved_at,
    escalationNote: row.escalation_note,
  };
}

export async function submitComplaint(input: {
  photoBase64: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
  sessionId: string;
}): Promise<{
  complaintId: string;
  department: string;
  slaDeadline: string;
  routingExplanation: string;
  ward: string;
}> {
  return request("/complaints", { method: "POST", body: JSON.stringify(input) });
}

export async function getComplaint(complaintId: string): Promise<Complaint | null> {
  try {
    const row = await request<any>(`/complaints-by-id/${complaintId}`);
    return mapComplaint(row);
  } catch {
    return null;
  }
}

export async function listComplaints(sessionId: string): Promise<Complaint[]> {
  const rows = await request<any[]>(`/complaints-by-session?sessionId=${encodeURIComponent(sessionId)}`);
  return rows.map(mapComplaint);
}
export async function deleteComplaint(complaintId: string, sessionId: string, reason?: string): Promise<{ complaintId: string; deleted: boolean }> {
  return request(`/delete-complaint/${complaintId}`, {
    method: "POST",
    body: JSON.stringify({ sessionId, reason }),
  });
}
