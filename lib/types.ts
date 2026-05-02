import type { LucideIcon } from "lucide-react"

export type AppLocale = "de" | "en" | "tr"
export type EntryCategory = "tiere" | "gegenstaende"
export type EntryType = "vermisst" | "gefunden"
export type EntryStatus = "offen" | "erledigt"
export type DirectoryCategory = "kultur" | "sport" | "handwerk" | "vereine" | "sonstiges"
export type NewsSource = "NDR" | "KN" | "POLIZEI" | "FEUERWEHR" | "STADT" | "SHZ"

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  external?: boolean
}

export interface EntryRecord {
  id: number
  created_at: string
  category: EntryCategory
  type: EntryType
  title: string
  description: string
  photo_path: string | null
  lat: number | null
  lng: number | null
  contact: string | null
  status: EntryStatus
  owner_token?: string | null
}

export interface NewsRecord {
  id: number
  fetched_at: string
  guid: string
  title: string
  link: string
  description: string
  author: string | null
  pub_date: string
  source: NewsSource
  image_path: string | null
}

export interface DirectoryRecord {
  id: number
  created_at: string
  category: DirectoryCategory
  name: string
  description: string
  logo_path: string | null
  address: string | null
  website: string | null
  phone: string | null
  email: string | null
  social_instagram: string | null
  social_facebook: string | null
  social_spotify: string | null
  social_tiktok: string | null
  social_soundcloud: string | null
  social_youtube: string | null
  social_linkedin: string | null
  social_whatsapp: string | null
  social_twitter: string | null
  social_bluesky: string | null
  social_mastodon: string | null
  social_bandcamp: string | null
  opening_hours: string | null
  lat: number | null
  lng: number | null
  approved: number
  owner_token?: string | null
}

export interface OpeningHoursDay {
  open: boolean
  from: string
  to: string
}

export interface OpeningHours {
  monday: OpeningHoursDay
  tuesday: OpeningHoursDay
  wednesday: OpeningHoursDay
  thursday: OpeningHoursDay
  friday: OpeningHoursDay
  saturday: OpeningHoursDay
  sunday: OpeningHoursDay
}

export interface MapMarker {
  id: number | string
  lat: number
  lng: number
  title: string
  description?: string | null
}

export const ENTRY_CATEGORIES: EntryCategory[] = ["tiere", "gegenstaende"]
export const ENTRY_TYPES: EntryType[] = ["vermisst", "gefunden"]
export const DIRECTORY_CATEGORIES: DirectoryCategory[] = [
  "kultur",
  "sport",
  "handwerk",
  "vereine",
  "sonstiges",
]
export const NEWS_SOURCES: NewsSource[] = ["NDR", "KN", "SHZ", "POLIZEI", "FEUERWEHR", "STADT"]

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export function defaultOpeningHours(): OpeningHours {
  const day: OpeningHoursDay = { open: false, from: "09:00", to: "17:00" }
  return {
    monday: { ...day },
    tuesday: { ...day },
    wednesday: { ...day },
    thursday: { ...day },
    friday: { ...day },
    saturday: { ...day },
    sunday: { ...day },
  }
}
