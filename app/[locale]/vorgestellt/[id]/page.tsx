import type { Metadata } from "next"
import Image from "next/image"
import {
  ArrowLeft,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import { formatOpeningHoursDisplay } from "@/lib/opening-hours"
import type { DirectoryCategory, DirectoryRecord } from "@/lib/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const entry = db
    .prepare(
      `SELECT name, description, logo_path FROM directory WHERE id = ? AND approved = 1`
    )
    .get(Number(id)) as
    | { name: string; description: string; logo_path: string | null }
    | undefined

  if (!entry) return {}

  const description = entry.description.slice(0, 160)
  const image = entry.logo_path
    ? `/api/logos/${entry.logo_path}`
    : "/og-image.png"

  return {
    title: entry.name,
    description,
    openGraph: {
      title: entry.name,
      description,
      images: [{ url: image }],
    },
  }
}

export const dynamic = "force-dynamic"

const categoryMessageKeys: Record<DirectoryCategory, string> = {
  kultur: "culture",
  sport: "sport",
  vereine: "clubs",
  sonstiges: "other",
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.54V6.78a4.85 4.85 0 01-1.07-.09z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function SoundCloudIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M1.175 12.225c-.017 0-.033.002-.049.003a.64.64 0 00-.044-.003C.48 12.225 0 12.74 0 13.374c0 .632.48 1.147 1.082 1.147.017 0 .033-.002.049-.003.016.001.032.003.049.003.6 0 1.082-.515 1.082-1.147 0-.634-.482-1.149-1.087-1.149zm2.44-2.138c-.038 0-.076.004-.113.012a1.95 1.95 0 00-.048-.012c-.832 0-1.507.676-1.507 1.507v3.93c0 .832.675 1.507 1.507 1.507.038 0 .076-.004.113-.012.016.008.032.012.048.012.831 0 1.506-.675 1.506-1.507v-3.93c0-.83-.674-1.507-1.506-1.507zm3.254-2.516c-.05 0-.099.006-.147.016a2.16 2.16 0 00-.074-.016c-1.11 0-2.009.9-2.009 2.01v5.98c0 1.109.9 2.009 2.01 2.009.05 0 .098-.006.146-.016.025.01.05.016.075.016 1.109 0 2.01-.9 2.01-2.01v-5.98c0-1.108-.9-2.009-2.011-2.009zm3.468-1.477c-.083 0-.164.01-.243.028a2.57 2.57 0 00-.108-.028c-1.366 0-2.473 1.107-2.473 2.473v7.326c0 1.366 1.107 2.473 2.473 2.473.084 0 .165-.01.244-.028.036.018.073.028.11.028 1.366 0 2.473-1.107 2.473-2.473V8.567c0-1.366-1.107-2.473-2.476-2.473zm5.97 1.128c-1.98 0-3.61 1.49-3.82 3.41a4.78 4.78 0 00-.03.52v4.68c0 .5.41.91.92.91.51 0 .92-.41.92-.91V10.76c0-.1.006-.2.018-.298.179-1.354 1.344-2.4 2.753-2.4 1.533 0 2.776 1.244 2.776 2.778v5.508c0 .5.41.91.92.91.51 0 .92-.41.92-.91V10.84c0-2.536-2.057-4.597-4.597-4.618z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function toSocialUrl(value: string, base: string): string {
  if (value.includes("://")) return value
  const handle = value.startsWith("@") ? value.slice(1) : value
  return `${base}/${handle}`
}

interface SocialLinkProps {
  value: string | null
  base: string
  label: string
  icon: React.ReactNode
}

function SocialLink({ value, base, label, icon }: SocialLinkProps) {
  if (!value) return null
  return (
    <a
      href={toSocialUrl(value, base)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}

export default async function DirectoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("directory")
  const common = await getTranslations("common")

  const entry = db
    .prepare(`SELECT * FROM directory WHERE id = ? AND approved = 1`)
    .get(Number(id)) as DirectoryRecord | undefined

  if (!entry) notFound()

  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(`owner_token_${entry.id}`)?.value
  const isOwner = Boolean(
    tokenCookie && entry.owner_token && tokenCookie === entry.owner_token
  )

  const formattedHours = formatOpeningHoursDisplay(entry.opening_hours)
  const categoryLabel = t(categoryMessageKeys[entry.category])

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: entry.name,
    description: entry.description,
    ...(entry.address ? { address: entry.address } : {}),
    ...(entry.phone ? { telephone: entry.phone } : {}),
    ...(entry.email ? { email: entry.email } : {}),
    ...(entry.website ? { url: entry.website } : {}),
    ...(entry.logo_path
      ? { image: `https://mynms.de/api/logos/${entry.logo_path}` }
      : {}),
  }

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/vorgestellt">
            <ArrowLeft size={16} className="mr-2" />
            {common("backToList")}
          </Link>
        </Button>
        {isOwner && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/vorgestellt/${entry.id}/bearbeiten`}>
              {t("edit")}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {entry.logo_path ? (
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-secondary">
              <Image
                src={`/api/logos/${encodeURIComponent(entry.logo_path)}`}
                alt={entry.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-3xl bg-secondary text-sm text-muted-foreground">
              {t("logo")}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="bubble-card space-y-3">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {categoryLabel}
            </Badge>
            <h1 className="break-words text-3xl font-bold tracking-tight">
              {entry.name}
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              {entry.description}
            </p>
          </section>

          {(entry.address || entry.phone || entry.email || entry.website) && (
            <section className="bubble-card space-y-3">
              <h2 className="text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                {common("contact")}
              </h2>
              <div className="grid gap-2 text-sm text-muted-foreground">
                {entry.address && (
                  <span className="inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="whitespace-pre-line break-words">{entry.address}</span>
                  </span>
                )}
                {entry.phone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4 shrink-0" />
                    <span>{entry.phone}</span>
                  </span>
                )}
                {entry.email && (
                  <a
                    href={`mailto:${entry.email}`}
                    className="inline-flex items-center gap-2 hover:text-foreground"
                  >
                    <Mail className="size-4 shrink-0" />
                    <span className="break-all">{entry.email}</span>
                  </a>
                )}
                {entry.website && (
                  <a
                    href={entry.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-foreground"
                  >
                    <Globe className="size-4 shrink-0" />
                    <span className="break-all">{entry.website}</span>
                  </a>
                )}
              </div>
            </section>
          )}

          {formattedHours && (
            <section className="bubble-card space-y-3">
              <h2 className="text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                {common("openingHours")}
              </h2>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {formattedHours}
              </p>
            </section>
          )}

          {(entry.social_instagram || entry.social_facebook || entry.social_tiktok ||
            entry.social_youtube || entry.social_spotify || entry.social_soundcloud ||
            entry.social_linkedin) && (
            <section className="bubble-card space-y-3">
              <h2 className="text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                {common("social")}
              </h2>
              <div className="flex flex-wrap gap-3">
                <SocialLink value={entry.social_instagram} base="https://instagram.com" label="Instagram" icon={<InstagramIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_facebook} base="https://facebook.com" label="Facebook" icon={<FacebookIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_tiktok} base="https://tiktok.com/@" label="TikTok" icon={<TikTokIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_youtube} base="https://youtube.com/@" label="YouTube" icon={<YouTubeIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_spotify} base="https://open.spotify.com/artist" label="Spotify" icon={<SpotifyIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_soundcloud} base="https://soundcloud.com" label="SoundCloud" icon={<SoundCloudIcon className="size-4 shrink-0" />} />
                <SocialLink value={entry.social_linkedin} base="https://linkedin.com/in" label="LinkedIn" icon={<LinkedInIcon className="size-4 shrink-0" />} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
