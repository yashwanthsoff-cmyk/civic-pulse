const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export class ApiNotImplementedError extends Error {
  constructor() {
    super("Backend not connected yet");
    this.name = "ApiNotImplementedError";
  }
}

export async function request<T>(
  functionPath: string,
  init?: RequestInit
): Promise<T> {
  if (!SUPABASE_URL || !ANON_KEY) throw new ApiNotImplementedError();
  const res = await fetch(`${FUNCTIONS_BASE}${functionPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  return (await res.json()) as T;
}