import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import ApproveButton from "@/components/admin/ApproveButton"
import { formatOpeningHoursDisplay } from "@/lib/opening-hours"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import type { DirectoryRecord } from "@/lib/types"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  gesundheit: "Gesundheit",
  finanzen: "Finanzen",
  gastronomie: "Gastronomie",
  kultur: "Kultur & Kreative",
  vereine: "Vereine & Initiativen",
  sonstiges: "Sonstiges",
}

export default async function AdminDirectoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = db
    .prepare(
      `SELECT id, created_at, category, name, description, logo_path, address, website,
              phone, email, social_instagram, social_facebook, opening_hours, lat, lng, approved
       FROM directory WHERE id = ?`
    )
    .get(Number(id)) as DirectoryRecord | undefined

  if (!entry) notFound()

  const hours = formatOpeningHoursDisplay(entry.opening_hours)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/admin/vorgestellt">
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/admin/vorgestellt/${id}/bearbeiten`}>
            <Pencil size={16} className="mr-2" />
            Bearbeiten
          </Link>
        </Button>
        <ApproveButton
          entryId={id}
          entryName={entry.name}
          approved={entry.approved}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{entry.name}</h1>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {CATEGORY_LABELS[entry.category] ?? entry.category}
              </Badge>
              <Badge variant={entry.approved === 1 ? "default" : "secondary"}>
                {entry.approved === 1 ? "Freigegeben" : "Ausstehend"}
              </Badge>
            </div>
          </div>
          {entry.logo_path && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              <Image
                src={`/api/logos/${encodeURIComponent(entry.logo_path)}`}
                alt="Logo"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          )}
        </div>

        <p className="text-muted-foreground">{entry.description}</p>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {entry.address && (
            <>
              <dt className="font-medium">Adresse</dt>
              <dd className="text-muted-foreground">{entry.address}</dd>
            </>
          )}
          {entry.website && (
            <>
              <dt className="font-medium">Website</dt>
              <dd>
                <a
                  href={entry.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {entry.website}
                </a>
              </dd>
            </>
          )}
          {entry.phone && (
            <>
              <dt className="font-medium">Telefon</dt>
              <dd className="text-muted-foreground">{entry.phone}</dd>
            </>
          )}
          {entry.email && (
            <>
              <dt className="font-medium">E-Mail</dt>
              <dd className="text-muted-foreground">{entry.email}</dd>
            </>
          )}
          {entry.social_instagram && (
            <>
              <dt className="font-medium">Instagram</dt>
              <dd className="text-muted-foreground">{entry.social_instagram}</dd>
            </>
          )}
          {entry.social_facebook && (
            <>
              <dt className="font-medium">Facebook</dt>
              <dd className="text-muted-foreground">{entry.social_facebook}</dd>
            </>
          )}
          {entry.lat && entry.lng && (
            <>
              <dt className="font-medium">Koordinaten</dt>
              <dd className="text-muted-foreground">
                {entry.lat.toFixed(5)}, {entry.lng.toFixed(5)}
              </dd>
            </>
          )}
          {hours && (
            <>
              <dt className="font-medium">Öffnungszeiten</dt>
              <dd className="whitespace-pre-line text-muted-foreground">
                {hours}
              </dd>
            </>
          )}
          <dt className="font-medium">Eingereicht am</dt>
          <dd className="text-muted-foreground">
            {new Date(entry.created_at).toLocaleDateString("de-DE")}
          </dd>
        </dl>
      </div>
    </div>
  )
}
