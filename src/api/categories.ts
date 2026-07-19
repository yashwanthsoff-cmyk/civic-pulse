const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export async function getCategories() {
  const url = `${FUNCTIONS_BASE}/categories`;
  console.log("Fetching categories from:", url);
  const res = await fetch(
    url,
    { headers: { Authorization: `Bearer ${ANON_KEY}` } }
  );
  console.log("Categories response status:", res.status);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Categories error response:", errorText);
    throw new Error(`Request failed (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  console.log("Categories data:", data);
  return data as Promise<{ categories: string[] }>;
}
