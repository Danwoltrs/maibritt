import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a string for use in PostgREST filter expressions (.or(), .ilike(), etc.)
 * Escapes characters that have special meaning in PostgREST filter syntax.
 */
export function sanitizeFilterValue(value: string): string {
  return value.replace(/[,.()"\\%]/g, '')
}
