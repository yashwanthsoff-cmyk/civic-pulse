import { request } from "./_client";

export type WardScore = {
  ward: string;
  totalComplaints: number;
  resolvedOnTime: number;
  escalated: number;
  avgOverdueDays: number | null;
  accountabilityScore: number | null;
};

export async function getWardScores(): Promise<{
  wards: WardScore[];
  cityWideScore: number | null;
  totalCurrentlyEscalated: number;
}> {
  return request("/wards");
}
