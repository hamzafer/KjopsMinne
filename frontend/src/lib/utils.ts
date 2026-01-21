import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely convert a value to number. Handles Decimal strings from API,
 * null/undefined, and already-numeric values.
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : parseFloat(String(value)) || 0;
}

/**
 * Format a quantity for display. Removes unnecessary trailing zeros.
 * "150.000" → "150", "1.500" → "1.5", "0.250" → "0.25"
 */
export function formatQty(value: number | string | null | undefined): string {
  const num = toNumber(value);
  if (num === 0) return "0";

  // Use toFixed to limit decimals, then remove trailing zeros
  const formatted = num.toFixed(3);
  return formatted.replace(/\.?0+$/, "");
}
