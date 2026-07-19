// supabase/functions/wards-scores/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComplaintRow {
  ward: string | null;
  status: string;
  sla_deadline: string;
  escalated_at: string | null;
  resolved_at: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("complaints")
      .select("ward, status, sla_deadline, escalated_at, resolved_at");

    if (error) throw error;

    const rows = (data ?? []) as ComplaintRow[];
    const wardMap = new Map<string, ComplaintRow[]>();

    for (const row of rows) {
      const ward = row.ward ?? "Unmapped Area";
      if (!wardMap.has(ward)) wardMap.set(ward, []);
      wardMap.get(ward)!.push(row);
    }

    const wards = Array.from(wardMap.entries()).map(([ward, complaints]) => {
      const totalComplaints = complaints.length;
      const resolvedOnTime = complaints.filter(
        (c) => c.resolved_at && new Date(c.resolved_at) <= new Date(c.sla_deadline)
      ).length;
      const escalated = complaints.filter((c) => c.status === "ESCALATED").length;

      const overdueDaysList = complaints
        .filter((c) => c.status === "ESCALATED" && c.escalated_at)
        .map((c) => {
          const diffMs = new Date(c.escalated_at!).getTime() - new Date(c.sla_deadline).getTime();
          return diffMs / (1000 * 60 * 60 * 24);
        });
      const avgOverdueDays =
        overdueDaysList.length > 0
          ? overdueDaysList.reduce((a, b) => a + b, 0) / overdueDaysList.length
          : null;

      const accountabilityScore =
        totalComplaints > 0 ? Math.round((resolvedOnTime / totalComplaints) * 100) : null;

      return {
        ward,
        totalComplaints,
        resolvedOnTime,
        escalated,
        avgOverdueDays: avgOverdueDays !== null ? Math.round(avgOverdueDays * 10) / 10 : null,
        accountabilityScore,
      };
    });

    wards.sort((a, b) => {
      if (a.accountabilityScore === null) return 1;
      if (b.accountabilityScore === null) return -1;
      return b.accountabilityScore - a.accountabilityScore;
    });

    const scoredWards = wards.filter((w) => w.accountabilityScore !== null);
    const cityWideScore =
      scoredWards.length > 0
        ? Math.round(
            scoredWards.reduce((sum, w) => sum + (w.accountabilityScore ?? 0), 0) / scoredWards.length
          )
        : null;

    const totalCurrentlyEscalated = rows.filter((r) => r.status === "ESCALATED").length;

    return new Response(
      JSON.stringify({ wards, cityWideScore, totalCurrentlyEscalated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in wards-scores function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});