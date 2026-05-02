"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import Image from "next/image"

import OpeningHoursInput, {
  parseOpeningHours,
} from "@/components/OpeningHoursInput"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DIRECTORY_CATEGORIES,
  type DirectoryCategory,
  type DirectoryRecord,
  type OpeningHours,
} from "@/lib/types"

const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  kultur: "Kultur & Kreative",
  sport: "Sport & Gesundheit",
  handwerk: "Handwerk & Dienstleistungen",
  vereine: "Vereine & Initiativen",
  sonstiges: "Sonstiges",
}

interface Props {
  id: string
}

export default function AdminDirectoryEditForm({ id }: Props) {
  const router = useRouter()
  const [entry, setEntry] = useState<DirectoryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [category, setCategory] = useState<DirectoryCategory>("kultur")
  const [approved, setApproved] = useState<"0" | "1">("0")
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    parseOpeningHours(null)
  )
  const [street, setStreet] = useState("")
  const [plz, setPlz] = useState("")
  const [city, setCity] = useState("")

  useEffect(() => {
    fetch(`/api/admin/directory/${id}`)
      .then((r) => r.json())
      .then((data: DirectoryRecord) => {
        setEntry(data)
        setCategory(data.category)
        setApproved(data.approved === 1 ? "1" : "0")
        setOpeningHours(parseOpeningHours(data.opening_hours))
        if (data.address) {
          const lines = data.address.split("\n")
          setStreet(lines[0] ?? "")
          const secondLine = lines[1] ?? ""
          const spaceIdx = secondLine.indexOf(" ")
          setPlz(spaceIdx >= 0 ? secondLine.slice(0, spaceIdx) : secondLine)
          setCity(spaceIdx >= 0 ? secondLine.slice(spaceIdx + 1) : "")
        }
      })
      .catch(() => setError("Eintrag konnte nicht geladen werden."))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("category", category)
    formData.set("approved", approved)
    formData.set("opening_hours", JSON.stringify(openingHours))
    const address = [street.trim(), [plz.trim(), city.trim()].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join("\n")
    formData.set("address", address)

    const res = await fetch(`/api/admin/directory/${id}`, {
      method: "PATCH",
      body: formData,
    })

    setSaving(false)
    if (!res.ok) {
      setError("Fehler beim Speichern.")
      return
    }
    setSuccess(true)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/admin/directory/${id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      router.push("/admin/vorgestellt")
    } else {
      setError("Fehler beim Löschen.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!entry) {
    return <p className="text-muted-foreground">Eintrag nicht gefunden.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/admin/vorgestellt/${id}`}>
            <ArrowLeft size={16} className="mr-2" />
            Zurück zur Ansicht
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="grid gap-4 md:grid-cols-2"
        encType="multipart/form-data"
      >
        <div className="space-y-2">
          <Label>Kategorie</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as DirectoryCategory)}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTORY_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={approved} onValueChange={(v) => setApproved(v as "0" | "1")}>
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Ausstehend</SelectItem>
              <SelectItem value="1">Freigegeben</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={entry.name}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Kurzbeschreibung *</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={entry.description}
            className="min-h-28 rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logo">Logo</Label>
          {entry.logo_path && (
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">
                <Image
                  src={`/api/logos/${encodeURIComponent(entry.logo_path)}`}
                  alt="Logo"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="removeLogo" value="true" />
                Logo entfernen
              </label>
            </div>
          )}
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addr_street">Straße & Hausnummer</Label>
          <Input
            id="addr_street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_plz">PLZ</Label>
          <Input
            id="addr_plz"
            value={plz}
            onChange={(e) => setPlz(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_city">Stadt</Label>
          <Input
            id="addr_city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            defaultValue={entry.website ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={entry.phone ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={entry.email ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_instagram">Instagram</Label>
          <Input
            id="social_instagram"
            name="social_instagram"
            defaultValue={entry.social_instagram ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_facebook">Facebook</Label>
          <Input
            id="social_facebook"
            name="social_facebook"
            defaultValue={entry.social_facebook ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_tiktok">TikTok</Label>
          <Input
            id="social_tiktok"
            name="social_tiktok"
            defaultValue={entry.social_tiktok ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_youtube">YouTube</Label>
          <Input
            id="social_youtube"
            name="social_youtube"
            defaultValue={entry.social_youtube ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_spotify">Spotify</Label>
          <Input
            id="social_spotify"
            name="social_spotify"
            defaultValue={entry.social_spotify ?? ""}
            placeholder="https://open.spotify.com/…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_soundcloud">SoundCloud</Label>
          <Input
            id="social_soundcloud"
            name="social_soundcloud"
            defaultValue={entry.social_soundcloud ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_linkedin">LinkedIn</Label>
          <Input
            id="social_linkedin"
            name="social_linkedin"
            defaultValue={entry.social_linkedin ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_whatsapp">WhatsApp</Label>
          <Input
            id="social_whatsapp"
            name="social_whatsapp"
            defaultValue={entry.social_whatsapp ?? ""}
            placeholder="Telefonnummer oder wa.me/…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_twitter">X / Twitter</Label>
          <Input
            id="social_twitter"
            name="social_twitter"
            defaultValue={entry.social_twitter ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_bluesky">Bluesky</Label>
          <Input
            id="social_bluesky"
            name="social_bluesky"
            defaultValue={entry.social_bluesky ?? ""}
            placeholder="benutzername oder https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_mastodon">Mastodon</Label>
          <Input
            id="social_mastodon"
            name="social_mastodon"
            defaultValue={entry.social_mastodon ?? ""}
            placeholder="@benutzer@instanz.social"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_bandcamp">Bandcamp</Label>
          <Input
            id="social_bandcamp"
            name="social_bandcamp"
            defaultValue={entry.social_bandcamp ?? ""}
            placeholder="https://…"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Öffnungszeiten</Label>
          <OpeningHoursInput value={openingHours} onChange={setOpeningHours} />
        </div>

        {error && (
          <p className="text-sm text-destructive md:col-span-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 md:col-span-2">Gespeichert.</p>
        )}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={saving} className="rounded-full">
            <Save size={16} className="mr-2" />
            {saving ? "Wird gespeichert…" : "Speichern"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                className="rounded-full"
              >
                <Trash2 size={16} className="mr-2" />
                {deleting ? "Wird gelöscht…" : "Löschen"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  „{entry.name}" wird endgültig gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  )
}
