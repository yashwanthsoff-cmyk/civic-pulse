// supabase/functions/heatmap/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEATMAP_CATEGORIES = ["Unsafe Area/Poor Lighting", "Streetlight Outage"];

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const timeOfDay = url.searchParams.get("timeOfDay") ?? "all";
    const categoryParam = url.searchParams.get("category") ?? "all";

    const categoriesToQuery =
      categoryParam === "all" ? HEATMAP_CATEGORIES : [categoryParam];

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("complaints")
      .select("latitude, longitude, category, submitted_at")
      .in("category", categoriesToQuery);

    if (error) throw error;

    let rows = data ?? [];

    if (timeOfDay === "day" || timeOfDay === "night") {
      rows = rows.filter((r) => {
        const utcMs = new Date(r.submitted_at).getTime();
        const istMs = utcMs + 5.5 * 60 * 60 * 1000; // shift to IST
        const istHour = new Date(istMs).getUTCHours();
        const isNight = istHour >= 18 || istHour < 6;
        return timeOfDay === "night" ? isNight : !isNight;
      });
    }

    const points = rows.map((r, i) => {
      const weight = rows.filter(
        (other, j) =>
          j !== i && haversineMeters(r.latitude, r.longitude, other.latitude, other.longitude) < 100
      ).length + 1;
      return { latitude: r.latitude, longitude: r.longitude, weight, category: r.category };
    });

    return new Response(
      JSON.stringify({ points, totalReports: points.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in heatmap function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});