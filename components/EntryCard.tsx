import Image from "next/image"
import { ArrowRight, Clock3, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { AppLocale, EntryRecord } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface EntryCardProps {
  entry: EntryRecord
  href: string
  locale: AppLocale
  statusLabel: string
  typeLabel: string
  detailsLabel: string
  postedOnLabel: string
  photoMissingLabel: string
}

export default function EntryCard({
  entry,
  href,
  locale,
  statusLabel,
  typeLabel,
  detailsLabel,
  postedOnLabel,
  photoMissingLabel,
}: EntryCardProps) {
  const formattedDate = formatDate(entry.created_at, locale)

  return (
    <article className="bubble-card-soft flex flex-col gap-4">
      {entry.photo_path ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-secondary">
          <Image
            src={`/api/photos/${encodeURIComponent(entry.photo_path)}`}
            alt={entry.title}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-secondary text-sm text-muted-foreground">
          {photoMissingLabel}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Badge
          variant={entry.status === "erledigt" ? "secondary" : "default"}
          className="rounded-full px-3 py-1"
        >
          {statusLabel}
        </Badge>
        <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {typeLabel}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">{entry.title}</h3>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {entry.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {postedOnLabel}: {formattedDate}
        </span>
        {entry.lat && entry.lng ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
          </span>
        ) : null}
      </div>

      <Button asChild variant="outline" className="mt-auto rounded-full">
        <Link href={href}>
          {detailsLabel}
          <ArrowRight size={16} className="ml-2" />
        </Link>
      </Button>
    </article>
  )
}
