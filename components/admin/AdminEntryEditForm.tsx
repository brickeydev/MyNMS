"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import Image from "next/image"

import MapClient from "@/components/MapClient"
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
import type { EntryRecord, EntryStatus } from "@/lib/types"

interface Props {
  id: string
  backHref: string
  publicHref: string
}

export default function AdminEntryEditForm({ id, backHref, publicHref }: Props) {
  const router = useRouter()
  const [entry, setEntry] = useState<EntryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState<EntryStatus>("offen")

  useEffect(() => {
    fetch(`/api/admin/entries/${id}`)
      .then((r) => r.json())
      .then((data: EntryRecord) => {
        setEntry(data)
        setStatus(data.status)
        if (data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng })
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
    formData.set("status", status)
    if (location) {
      formData.set("lat", String(location.lat))
      formData.set("lng", String(location.lng))
    }

    const res = await fetch(`/api/admin/entries/${id}`, {
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
    const res = await fetch(`/api/admin/entries/${id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      router.push(backHref)
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
          <Link href={backHref}>
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={publicHref} target="_blank">
            Öffentlich ansehen
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="grid gap-4 md:grid-cols-2"
      >
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={entry.title}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Beschreibung *</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={entry.description}
            className="min-h-32 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as EntryStatus)}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="erledigt">Erledigt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Kontakt</Label>
          <Input
            id="contact"
            name="contact"
            defaultValue={entry.contact ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="photo">Foto ersetzen</Label>
          {entry.photo_path && (
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">
                <Image
                  src={`/api/photos/${encodeURIComponent(entry.photo_path)}`}
                  alt="Foto"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="removePhoto" value="true" />
                Foto entfernen
              </label>
            </div>
          )}
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Standort</Label>
          <MapClient interactive value={location} onChange={setLocation} />
        </div>

        {error && (
          <p className="text-sm text-destructive md:col-span-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 md:col-span-2">
            Gespeichert.
          </p>
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
                  „{entry.title}" wird endgültig gelöscht.
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
