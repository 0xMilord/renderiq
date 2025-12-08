import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSentenceCase(text: string): string {
  if (!text) return text;
  // Convert to sentence case: first letter uppercase, rest lowercase
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}