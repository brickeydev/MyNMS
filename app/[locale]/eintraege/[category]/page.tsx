import type { Metadata } from "next"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import EntryCard from "@/components/EntryCard"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import {
  ENTRY_CATEGORIES,
  ENTRY_TYPES,
  type AppLocale,
  type EntryCategory,
  type EntryRecord,
  type EntryType,
} from "@/lib/types"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (category === "tiere") {
    return {
      title: "Fundtiere",
      description: "Vermisste und gefundene Tiere aus Neumünster und Umgebung.",
      alternates: { canonical: "https://mynms.de/de/eintraege/tiere" },
    }
  }
  return {
    title: "Fundsachen",
    description: "Verlorene und gefundene Gegenstände aus Neumünster.",
    alternates: { canonical: "https://mynms.de/de/eintraege/gegenstaende" },
  }
}

export const dynamic = "force-dynamic"

export default async function EntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale; category: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { locale, category } = await params
  const { type } = await searchParams
  const t = await getTranslations()

  if (!ENTRY_CATEGORIES.includes(category as EntryCategory)) {
    notFound()
  }

  const activeCategory = category as EntryCategory
  const activeType = ENTRY_TYPES.includes(type as EntryType)
    ? (type as EntryType)
    : undefined

  const entries = activeType
    ? (db
        .prepare(
          `
            SELECT *
            FROM entries
            WHERE category = ? AND type = ?
            ORDER BY datetime(created_at) DESC
          `
        )
        .all(activeCategory, activeType) as EntryRecord[])
    : (db
        .prepare(
          `
            SELECT *
            FROM entries
            WHERE category = ?
            ORDER BY datetime(created_at) DESC
          `
        )
        .all(activeCategory) as EntryRecord[])

  const title =
    activeCategory === "tiere"
      ? t("entries.titleAnimals")
      : t("entries.titleObjects")
  const description =
    activeCategory === "tiere"
      ? t("entries.descriptionAnimals")
      : t("entries.descriptionObjects")
  const emptyMessage =
    activeCategory === "tiere"
      ? t("entries.emptyAnimals")
      : t("entries.emptyObjects")

  return (
    <div className="space-y-6">
      <section className="bubble-card flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h1 className="section-title">{title}</h1>
          <p className="section-copy">{description}</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href={`/neu?category=${activeCategory}`}>
            <Plus size={16} className="mr-2" />
            {t("entries.create")}
          </Link>
        </Button>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/eintraege/${activeCategory}`}
          className={cn("pill-tab", !activeType && "pill-tab-active")}
        >
          {t("entries.allTypes")}
        </Link>
        <Link
          href={`/eintraege/${activeCategory}?type=vermisst`}
          className={cn(
            "pill-tab",
            activeType === "vermisst" && "pill-tab-active"
          )}
        >
          {t("entries.missing")}
        </Link>
        <Link
          href={`/eintraege/${activeCategory}?type=gefunden`}
          className={cn(
            "pill-tab",
            activeType === "gefunden" && "pill-tab-active"
          )}
        >
          {t("entries.found")}
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bubble-card-soft text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              href={`/eintraege/${activeCategory}/${entry.id}`}
              locale={locale}
              statusLabel={
                entry.status === "erledigt"
                  ? t("entries.resolved")
                  : t("entries.open")
              }
              typeLabel={
                entry.type === "vermisst"
                  ? t("entries.missing")
                  : t("entries.found")
              }
              detailsLabel={t("entries.details")}
              postedOnLabel={t("entries.postedOn")}
              photoMissingLabel={t("entries.photoMissing")}
            />
          ))}
        </div>
      )}
    </div>
  )
}
