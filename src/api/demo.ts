import { request } from "./_client";
export async function fastForwardComplaint(complaintId: string, demoKey: string) {
  return request<{ complaintId: string; newSlaDeadline: string }>(
    `/demo/fast-forward/${complaintId}`,
    { method: "POST", headers: { "X-Demo-Key": demoKey } },
  );
}
