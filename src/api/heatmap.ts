const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export async function getHeatmap(timeOfDay: "all" | "day" | "night", category: string = "all") {
  const url = `${FUNCTIONS_BASE}/heatmap?timeOfDay=${timeOfDay}&category=${encodeURIComponent(category)}`;
  console.log("Fetching heatmap from:", url);
  const res = await fetch(
    url,
    { headers: { Authorization: `Bearer ${ANON_KEY}` } }
  );
  console.log("Heatmap response status:", res.status);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Heatmap error response:", errorText);
    throw new Error(`Request failed (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  console.log("Heatmap data:", data);
  return data as Promise<{
    points: Array<{ latitude: number; longitude: number; weight: number; category: string }>;
    totalReports: number;
  }>;
}