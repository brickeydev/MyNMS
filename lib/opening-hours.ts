import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type OpeningHours,
  defaultOpeningHours,
} from "@/lib/types"

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Montag",
  tuesday: "Dienstag",
  wednesday: "Mittwoch",
  thursday: "Donnerstag",
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag",
}

export function parseOpeningHours(json: string | null): OpeningHours {
  if (!json) return defaultOpeningHours()
  try {
    return JSON.parse(json) as OpeningHours
  } catch {
    return defaultOpeningHours()
  }
}

export function formatOpeningHoursDisplay(json: string | null): string | null {
  if (!json) return null
  try {
    const hours = JSON.parse(json) as OpeningHours
    const lines: string[] = []
    for (const day of DAYS_OF_WEEK) {
      const d = hours[day]
      if (d?.open) {
        lines.push(`${DAY_LABELS[day]}: ${d.from}–${d.to}`)
      }
    }
    return lines.length ? lines.join("\n") : null
  } catch {
    return json
  }
}
