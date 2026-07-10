import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InvoiceStatus } from "@/types";

// Merges Tailwind classes safely — avoids conflicts like "p-2 p-4"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a number as currency: 1500 → "$1,500.00"
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Formats ISO date string: "2024-01-15T00:00:00Z" → "Jan 15, 2024"
export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Returns today's date as "yyyy-MM-dd" for date input fields
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns date 30 days from now as "yyyy-MM-dd"
export function thirtyDaysFromNow(): string {
  return new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
}

// Returns Tailwind classes for each invoice status badge
export function getStatusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    Draft: "bg-gray-100 text-gray-700 border-gray-200",
    Sent: "bg-blue-50 text-blue-700 border-blue-200",
    Paid: "bg-green-50 text-green-700 border-green-200",
    Overdue: "bg-red-50 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

// Calculates one line item total including tax
export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  taxPercent: number
): number {
  const subtotal = quantity * unitPrice;
  return subtotal + (subtotal * taxPercent) / 100;
}

// Calculates total for all line items
export function calculateInvoiceTotal(
  items: { quantity: number; unitPrice: number; taxPercent: number }[]
): number {
  return items.reduce(
    (sum, item) =>
      sum + calculateItemTotal(item.quantity, item.unitPrice, item.taxPercent),
    0
  );
}

// Gets initials from a name: "Jane Smith" → "JS"
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}