// supabase/functions/escalation-sweep/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

async function generateEscalationNote(category: string): Promise<string> {
  const fallback = `This ${category} complaint has exceeded its resolution window and has been escalated to the ward office.`;
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You write one short, plain-language sentence (under 20 words) telling a citizen their civic complaint has been escalated for lack of timely response. Return ONLY the sentence, no quotes, no JSON.",
          },
          { role: "user", content: `Category: ${category}` },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`Groq returned ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || fallback;
  } catch (err) {
    console.error("Groq escalation note failed, using fallback:", err);
    return fallback;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const providedSecret = req.headers.get("x-cron-secret");
  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    const { data: overdue, error: fetchError } = await supabase
      .from("complaints")
      .select("id, category")
      .in("status", ["SUBMITTED", "IN_PROGRESS"])
      .lt("sla_deadline", nowIso);

    if (fetchError) throw fetchError;

    let escalatedCount = 0;
    for (const row of overdue ?? []) {
      const note = await generateEscalationNote(row.category);
      const { error: updateError } = await supabase
        .from("complaints")
        .update({
          status: "ESCALATED",
          escalated_at: new Date().toISOString(),
          escalation_note: note,
        })
        .eq("id", row.id);

      if (!updateError) escalatedCount++;
      else console.error(`Failed to escalate ${row.id}:`, updateError);
    }

    return new Response(
      JSON.stringify({ scanned: overdue?.length ?? 0, escalated: escalatedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in escalation-sweep function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});