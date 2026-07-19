// supabase/functions/delete-complaint/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const complaintId = url.pathname.split("/").pop();
    const body = await req.json().catch(() => ({}));
    const { sessionId, reason } = body;

    if (!complaintId || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing complaintId or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: existing, error: fetchError } = await supabase
      .from("complaints")
      .select("id, session_id")
      .eq("id", complaintId)
      .single();

    if (fetchError || !existing) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing.session_id !== sessionId) {
      return new Response(JSON.stringify({ error: "You can only delete your own reports" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabase
      .from("complaints")
      .delete()
      .eq("id", complaintId);

    if (deleteError) throw deleteError;

    console.log(`Deleted complaint ${complaintId}, reason: ${reason ?? "not specified"}`);

    return new Response(
      JSON.stringify({ complaintId, deleted: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in delete-complaint function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
