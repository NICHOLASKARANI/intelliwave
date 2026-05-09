import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
  }).format(date)
}