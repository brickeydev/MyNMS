import type { Metadata } from "next"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import MapClient from "@/components/MapClient"
import ResolveEntryButton from "@/components/ResolveEntryButton"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import {
  ENTRY_CATEGORIES,
  type AppLocale,
  type EntryCategory,
  type EntryRecord,
} from "@/lib/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}): Promise<Metadata> {
  const { category, id } = await params
  const entry = db
    .prepare(`SELECT title, description, photo_path FROM entries WHERE id = ? AND category = ?`)
    .get(Number(id), category) as
    | { title: string; description: string; photo_path: string | null }
    | undefined

  if (!entry) return {}

  const description = entry.description.slice(0, 160)
  const image = entry.photo_path
    ? `/api/photos/${entry.photo_path}`
    : "/og-image.png"

  return {
    title: entry.title,
    description,
    openGraph: {
      title: entry.title,
      description,
      images: [{ url: image }],
    },
  }
}

export const dynamic = "force-dynamic"

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ locale: AppLocale; category: string; id: string }>
}) {
  const { locale, category, id } = await params
  const t = await getTranslations()

  if (!ENTRY_CATEGORIES.includes(category as EntryCategory)) {
    notFound()
  }

  const entry = db
    .prepare(
      `
        SELECT *
        FROM entries
        WHERE id = ? AND category = ?
      `
    )
    .get(Number(id), category) as EntryRecord | undefined

  if (!entry) {
    notFound()
  }

  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(`owner_token_${entry.id}`)?.value
  const isOwner = Boolean(
    tokenCookie && entry.owner_token && tokenCookie === entry.owner_token
  )

  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(entry.created_at))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/eintraege/${category}`}>
            <ArrowLeft size={16} className="mr-2" />
            {t("common.backToList")}
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/eintraege/${category}/${entry.id}/bearbeiten`}>
                {t("entryDetail.editEntry")}
              </Link>
            </Button>
          ) : null}
          {isOwner && entry.status !== "erledigt" ? (
            <ResolveEntryButton entryId={entry.id} />
          ) : null}
        </div>
      </div>

      <section className="bubble-card grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-secondary">
            {entry.photo_path ? (
              <div className="relative aspect-[4/3]">
                <Image
                  src={`/api/photos/${encodeURIComponent(entry.photo_path)}`}
                  alt={entry.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                {t("entries.photoMissing")}
              </div>
            )}
          </div>
        </div>

        <div className="bubble-card-soft space-y-4">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {entry.type === "vermisst"
                ? t("entries.missing")
                : t("entries.found")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
            <p className="section-copy">{entry.description}</p>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="font-medium">{t("common.status")}</p>
              <p className="mt-1 text-muted-foreground">
                {entry.status === "erledigt"
                  ? t("entries.resolved")
                  : t("entries.open")}
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="font-medium">{t("entries.postedOn")}</p>
              <p className="mt-1 text-muted-foreground">{formattedDate}</p>
            </div>
            {entry.contact ? (
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="font-medium">{t("common.contact")}</p>
                <p className="mt-1 text-muted-foreground">{entry.contact}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bubble-card space-y-4">
        <h2 className="text-2xl font-semibold">{t("entryDetail.mapTitle")}</h2>
        {entry.lat && entry.lng ? (
          <MapClient value={{ lat: entry.lat, lng: entry.lng }} />
        ) : (
          <div className="bubble-card-soft text-sm text-muted-foreground">
            {t("entryDetail.noLocation")}
          </div>
        )}
      </section>
    </div>
  )
}
