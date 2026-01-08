import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges tailwind classes cleanly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to JPY/USD based on preference (Defaulting to ¥ as per your mockup)
export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-JP", {
    style: "currency",
    currency: "JPY",
  }).format(num);
}

// Format simple dates
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}
