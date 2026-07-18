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
}> {
  return request("/complaints", { method: "POST", body: JSON.stringify(input) });
}

export async function getComplaint(complaintId: string): Promise<Complaint | null> {
  return request(`/complaints/${complaintId}`);
}

export async function listComplaints(sessionId: string): Promise<Complaint[]> {
  return request(`/complaints?sessionId=${encodeURIComponent(sessionId)}`);
}
