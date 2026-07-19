// supabase/functions/complaints/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWardForCoordinates } from "../_shared/wards.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLA_HOURS: Record<string, number> = {
  "Pothole": 168,
  "Streetlight Outage": 72,
  "Garbage/Sanitation": 48,
  "Blocked Drain": 96,
  "Unsafe Area/Poor Lighting": 24,
  "Encroachment": 240,
  "Other": 120,
};

const DEPARTMENTS: Record<string, string> = {
  "Pothole": "Public Works Department",
  "Streetlight Outage": "Electrical Department",
  "Garbage/Sanitation": "Sanitation Department",
  "Blocked Drain": "Drainage Department",
  "Unsafe Area/Poor Lighting": "Traffic Police",
  "Encroachment": "Municipal Enforcement",
  "Other": "Municipal Enforcement",
};

async function classifyWithGroq(category: string, description: string) {
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
            content: `You are a civic complaint routing assistant for an Indian municipal corporation. Given a complaint category and description, return ONLY valid JSON: { "category": string, "department": string, "slaHours": number, "routingExplanation": string }. Departments: Public Works Department, Electrical Department, Sanitation Department, Drainage Department, Traffic Police, Municipal Enforcement. Default slaHours by category unless description suggests otherwise: Pothole=168, Streetlight Outage=72, Garbage/Sanitation=48, Blocked Drain=96, Unsafe Area/Poor Lighting=24, Encroachment=240, Other=120. routingExplanation under 20 words, plain citizen-facing language.`,
          },
          {
            role: "user",
            content: `Category: ${category}\nDescription: ${description || "(none provided)"}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`Groq API returned ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Groq classification failed, using fallback:", err);
    return {
      category,
      department: DEPARTMENTS[category] ?? "Municipal Enforcement",
      slaHours: SLA_HOURS[category] ?? 120,
      routingExplanation: `Routed to ${DEPARTMENTS[category] ?? "Municipal Enforcement"} based on category.`,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { photoBase64, latitude, longitude, category, description, sessionId } = body;

    if (!photoBase64 || latitude == null || longitude == null || !category || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const complaintId = crypto.randomUUID();
    const photoBytes = Uint8Array.from(atob(photoBase64.split(",").pop()), (c) => c.charCodeAt(0));
    const photoPath = `complaints/${complaintId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("complaint-photos")
      .upload(photoPath, photoBytes, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("complaint-photos").getPublicUrl(photoPath);
    const photoUrl = urlData.publicUrl;
    const ward = getWardForCoordinates(latitude, longitude);
    const classification = await classifyWithGroq(category, description ?? "");

    const submittedAt = new Date();
    const slaDeadline = new Date(submittedAt.getTime() + classification.slaHours * 60 * 60 * 1000);

    const { data: inserted, error: insertError } = await supabase
      .from("complaints")
      .insert({
        id: complaintId,
        session_id: sessionId,
        latitude,
        longitude,
        ward,
        category: classification.category ?? category,
        description: description ?? null,
        photo_url: photoUrl,
        department: classification.department,
        status: "SUBMITTED",
        submitted_at: submittedAt.toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        routing_explanation: classification.routingExplanation,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        complaintId: inserted.id,
        department: inserted.department,
        slaDeadline: inserted.sla_deadline,
        routingExplanation: inserted.routing_explanation,
        ward: inserted.ward,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in complaints function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});