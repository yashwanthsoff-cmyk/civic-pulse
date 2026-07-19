import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWard(ward: string): string {
  if (ward === "Unmapped Area") {
    return "Outside coverage zone — demo currently scoped to 16 Bengaluru wards";
  }
  return ward;
}
