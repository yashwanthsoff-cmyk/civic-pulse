export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

export class ApiNotImplementedError extends Error {
  constructor() {
    super("Backend not connected yet");
    this.name = "ApiNotImplementedError";
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new ApiNotImplementedError();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
