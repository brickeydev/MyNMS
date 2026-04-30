import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const VALID_LOCALES = ["de", "en", "tr"]

export function getSafeLocale(locale: string): string {
  return VALID_LOCALES.includes(locale) ? locale : "de"
}

export function formatDate(date: string | Date, locale: string): string {
  const safeLocale = getSafeLocale(locale)
  try {
    return new Date(date).toLocaleDateString(safeLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return new Date(date).toLocaleDateString("de")
  }
}
