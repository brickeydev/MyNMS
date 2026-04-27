import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import NewsItem from "@/components/NewsItem"
import { Link } from "@/i18n/navigation"
import { getNewsItems } from "@/lib/news"
import { NEWS_SOURCES, type AppLocale, type NewsSource } from "@/lib/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Nachrichten",
  description:
    "Aktuelle lokale Nachrichten aus Neumünster von NDR, Kieler Nachrichten, SHZ, Polizei, Feuerwehr und der Stadt.",
  alternates: { canonical: "https://mynms.de/de/nachrichten" },
}

export const dynamic = "force-dynamic"

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>
  searchParams: Promise<{ source?: string }>
}) {
  const { locale } = await params
  const { source } = await searchParams
  const t = await getTranslations()
  const activeSource = NEWS_SOURCES.includes(source as NewsSource)
    ? (source as NewsSource)
    : undefined
  const items = await getNewsItems({ source: activeSource, limit: 48 })

  return (
    <div className="space-y-6">
      <section className="bubble-card space-y-3">
        <h1 className="section-title">{t("news.title")}</h1>
        <p className="section-copy">{t("news.description")}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/nachrichten"
          className={cn("pill-tab", !activeSource && "pill-tab-active")}
        >
          {t("news.all")}
        </Link>
        {NEWS_SOURCES.map((item) => (
          <Link
            key={item}
            href={`/nachrichten?source=${item}`}
            className={cn(
              "pill-tab",
              activeSource === item && "pill-tab-active"
            )}
          >
            {item}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="bubble-card-soft text-sm text-muted-foreground">
          {t("news.empty")}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <NewsItem
              key={item.guid}
              item={item}
              locale={locale}
              byLabel={t("news.by")}
              readMoreLabel={t("common.externalLink")}
              anonymousLabel={t("common.anonymous")}
            />
          ))}
        </div>
      )}
    </div>
  )
}
