"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
  DIRECTORY_CATEGORIES,
  type DirectoryCategory,
  type DirectoryRecord,
} from "@/lib/types"

interface DirectoryBrowserProps {
  entries: DirectoryRecord[]
}

const categoryMessageKeys: Record<DirectoryCategory, string> = {
  kultur: "culture",
  sport: "sport",
  handwerk: "handwerk",
  vereine: "clubs",
  sonstiges: "other",
}

export default function DirectoryBrowser({ entries }: DirectoryBrowserProps) {
  const t = useTranslations("directory")
  const common = useTranslations("common")
  const [activeCategory, setActiveCategory] =
    useState<DirectoryCategory>("kultur")

  const categoryEntries = entries.filter(
    (entry) => entry.category === activeCategory
  )

  const categoryLabel = t(categoryMessageKeys[activeCategory])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {DIRECTORY_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "pill-tab",
              activeCategory === category && "pill-tab-active"
            )}
          >
            {t(categoryMessageKeys[category])}
          </button>
        ))}
      </div>

      {categoryEntries.length === 0 ? (
        <div className="bubble-card-soft text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryEntries.map((entry) => (
            <article
              key={entry.id}
              className="bubble-card-soft flex flex-col gap-4"
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
                  {t("logo")}
                </div>
              )}

              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                {categoryLabel}
              </Badge>

              <div className="space-y-2">
                <h3 className="break-words text-xl font-semibold tracking-tight">
                  {entry.name}
                </h3>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {entry.description}
                </p>
              </div>

              <Button asChild variant="outline" className="mt-auto rounded-full">
                <Link href={`/vorgestellt/${entry.id}`}>
                  {common("readMore")}
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
