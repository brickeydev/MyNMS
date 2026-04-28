import type { Metadata } from "next"
import { AlertTriangle, ArrowRight, ExternalLink, Package, PawPrint, Sparkles } from "lucide-react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

import EntryCard from "@/components/EntryCard"
import NewsItem from "@/components/NewsItem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import { getNewsItems } from "@/lib/news"
import type { AppLocale, DirectoryRecord, EntryRecord } from "@/lib/types"

export const metadata: Metadata = {
  title: "Start",
  description:
    "Deine lokale Community-Plattform für Neumünster – Fundtiere, Fundsachen und aktuelle Nachrichten.",
  alternates: {
    canonical: "https://mynms.de",
    languages: {
      "x-default": "https://mynms.de",
      de: "https://mynms.de/de",
      en: "https://mynms.de/en",
      tr: "https://mynms.de/tr",
    },
  },
}

export const dynamic = "force-dynamic"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  const news = await getNewsItems({ limit: 3 })

  const latestAnimals = db
    .prepare(
      `SELECT * FROM entries WHERE category = 'tiere' ORDER BY datetime(created_at) DESC LIMIT 3`
    )
    .all() as EntryRecord[]

  const latestObjects = db
    .prepare(
      `SELECT * FROM entries WHERE category = 'gegenstaende' ORDER BY datetime(created_at) DESC LIMIT 3`
    )
    .all() as EntryRecord[]

  const featuredEntries = db
    .prepare(
      `SELECT id, name, description, logo_path, category FROM directory WHERE approved = 1 ORDER BY name COLLATE NOCASE ASC LIMIT 3`
    )
    .all() as Pick<DirectoryRecord, "id" | "name" | "description" | "logo_path" | "category">[]

  return (
    <>
      <section className="bubble-card space-y-5">
        <Badge className="w-fit rounded-full bg-primary/15 px-4 py-1 text-primary hover:bg-primary/15">
          {t("home.badge")}
        </Badge>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight md:max-w-3xl md:text-5xl">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {t("home.description")}
          </p>
        </div>
      </section>

      <section className="bubble-card space-y-5">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <PawPrint className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="section-title">{t("home.latestAnimals")}</h2>
          <p className="section-copy">{t("home.animalsDescription")}</p>
        </div>

        {latestAnimals.length === 0 ? (
          <div className="bubble-card-soft text-sm text-muted-foreground">
            {t("entries.emptyAnimals")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestAnimals.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                href={`/eintraege/tiere/${entry.id}`}
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

        <Button asChild variant="outline" className="rounded-full">
          <Link href="/eintraege/tiere">
            {t("common.openArea")}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </section>

      <section className="bubble-card space-y-5">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Package className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="section-title">{t("home.latestObjects")}</h2>
          <p className="section-copy">{t("home.objectsDescription")}</p>
        </div>

        {latestObjects.length === 0 ? (
          <div className="bubble-card-soft text-sm text-muted-foreground">
            {t("entries.emptyObjects")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestObjects.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                href={`/eintraege/gegenstaende/${entry.id}`}
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

        <Button asChild variant="outline" className="rounded-full">
          <Link href="/eintraege/gegenstaende">
            {t("common.openArea")}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </section>

      <section className="bubble-card space-y-5">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="section-title">{t("home.featuredTitle")}</h2>
          <p className="section-copy">{t("home.featuredDescription")}</p>
        </div>

        {featuredEntries.length === 0 ? (
          <div className="bubble-card-soft text-sm text-muted-foreground">
            {t("directory.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/vorgestellt/${entry.id}`}
                className="bubble-card-soft flex flex-col gap-3 transition-shadow hover:shadow-md"
              >
                {entry.logo_path ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
                    <Image
                      src={`/api/logos/${encodeURIComponent(entry.logo_path)}`}
                      alt={entry.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-secondary text-sm text-muted-foreground">
                    {t("directory.logo")}
                  </div>
                )}
                <h3 className="break-words font-semibold tracking-tight">
                  {entry.name}
                </h3>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {entry.description}
                </p>
              </Link>
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="rounded-full">
          <Link href="/vorgestellt">
            {t("common.openArea")}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </section>

      <section className="bubble-card-soft flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex rounded-2xl bg-secondary p-3 text-primary">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("home.issuesTitle")}
          </h2>
          <p className="section-copy">{t("home.issuesDescription")}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <a
            href="https://www.neumuenster.de/buergerservice/ideen-und-beschwerden"
            target="_blank"
            rel="noreferrer"
          >
            {t("common.externalLink")}
            <ExternalLink size={16} className="ml-2" />
          </a>
        </Button>
      </section>

      <section className="bubble-card space-y-5">
        <div className="space-y-2">
          <h2 className="section-title">{t("home.newsTitle")}</h2>
          <p className="section-copy">{t("home.newsDescription")}</p>
        </div>

        {news.length === 0 ? (
          <div className="bubble-card-soft text-sm text-muted-foreground">
            {t("home.newsEmpty")}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {news.map((item) => (
              <NewsItem
                key={item.guid}
                item={item}
                locale={locale}
                byLabel={t("news.by")}
                readMoreLabel={t("common.readMore")}
                anonymousLabel={t("common.anonymous")}
                compact
              />
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="rounded-full">
          <Link href="/nachrichten">
            {t("home.toNews")}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </section>
    </>
  )
}
