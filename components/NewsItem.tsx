import { Clock3, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AppLocale, NewsRecord } from "@/lib/types"
import { getSafeLocale } from "@/lib/utils"

interface NewsItemProps {
  item: NewsRecord
  locale: AppLocale
  byLabel: string
  readMoreLabel: string
  anonymousLabel: string
  compact?: boolean
}

export default function NewsItem({
  item,
  locale,
  byLabel,
  readMoreLabel,
  anonymousLabel,
  compact = false,
}: NewsItemProps) {
  const formattedDate = new Intl.DateTimeFormat(getSafeLocale(locale), {
    dateStyle: "medium",
    timeStyle: compact ? undefined : "short",
  }).format(new Date(item.pub_date))

  return (
    <article className="bubble-card-soft space-y-4">
      {item.image_path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/news-images/${encodeURIComponent(item.image_path)}`}
          alt=""
          loading="lazy"
          className="w-full rounded-xl object-cover max-h-[200px]"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {item.source}
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          {formattedDate}
        </span>
      </div>

      <div className="space-y-2">
        <h3
          className={
            compact
              ? "text-base font-semibold tracking-tight"
              : "text-lg font-semibold tracking-tight"
          }
        >
          {item.title}
        </h3>
        {item.author && (
          <p className="text-sm text-muted-foreground">
            {byLabel}: {item.author}
          </p>
        )}
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>

      <Button asChild variant="outline" className="rounded-full">
        <a href={item.link} target="_blank" rel="noreferrer">
          {readMoreLabel}
          <ExternalLink size={16} className="ml-2" />
        </a>
      </Button>
    </article>
  )
}
