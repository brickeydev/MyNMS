"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import EditLinkModal from "@/components/EditLinkModal"
import MapClient from "@/components/MapClient"
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
import { useRouter } from "@/i18n/navigation"
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type EntryType,
} from "@/lib/types"

export default function NewEntryForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations()
  const requestedCategory = searchParams.get("category")
  const baseCategory = ENTRY_CATEGORIES.includes(
    requestedCategory as EntryCategory
  )
    ? (requestedCategory as EntryCategory)
    : "tiere"
  const [categoryOverride, setCategoryOverride] =
    useState<EntryCategory | null>(null)
  const [type, setType] = useState<EntryType>("vermisst")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<"idle" | "error">("idle")
  const [locationError, setLocationError] = useState(false)
  const [editUrl, setEditUrl] = useState<string | null>(null)
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)
  const category = categoryOverride ?? baseCategory

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!location) {
      setLocationError(true)
      return
    }
    setLocationError(false)

    setIsSubmitting(true)
    setState("idle")

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("category", category)
    formData.set("type", type)
    formData.set("lat", String(location.lat))
    formData.set("lng", String(location.lng))

    const response = await fetch("/api/entries", {
      method: "POST",
      body: formData,
    })

    setIsSubmitting(false)

    if (!response.ok) {
      setState("error")
      return
    }

    const payload = (await response.json()) as {
      id: number
      category: EntryCategory
      token: string
    }

    const existing = document.cookie
      .split("; ")
      .find((c) => c.startsWith("mynms_owned="))
      ?.split("=")[1] ?? ""
    const owned = existing ? existing.split(",") : []
    owned.push(String(payload.id))
    document.cookie = `mynms_owned=${owned.join(",")};max-age=31536000;path=/`

    const url = `${window.location.origin}/eintraege/${payload.category}/${payload.id}/bearbeiten?token=${payload.token}`
    setEditUrl(url)
    setPendingRedirect(`/eintraege/${payload.category}/${payload.id}`)
    form.reset()
  }

  return (
    <div className="space-y-6">
      {editUrl && (
        <EditLinkModal
          open={true}
          editUrl={editUrl}
          onClose={() => {
            setEditUrl(null)
            if (pendingRedirect) {
              router.push(pendingRedirect as Parameters<typeof router.push>[0])
            }
          }}
        />
      )}

      <section className="bubble-card space-y-3">
        <h1 className="section-title">{t("newEntry.title")}</h1>
        <p className="section-copy">{t("newEntry.description")}</p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="bubble-card grid gap-4 md:grid-cols-2"
      >
        <div className="space-y-2">
          <Label>{t("newEntry.category")}</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setCategoryOverride(value as EntryCategory)
            }
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tiere">{t("navigation.animals")}</SelectItem>
              <SelectItem value="gegenstaende">
                {t("navigation.objects")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("newEntry.type")}</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as EntryType)}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vermisst">{t("entries.missing")}</SelectItem>
              <SelectItem value="gefunden">{t("entries.found")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">{t("newEntry.titleField")}</Label>
          <Input
            id="title"
            name="title"
            required
            className="rounded-2xl"
            placeholder={t("newEntry.titlePlaceholder")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">{t("newEntry.descriptionField")}</Label>
          <Textarea
            id="description"
            name="description"
            required
            className="min-h-32 rounded-2xl"
            placeholder={t("newEntry.descriptionPlaceholder")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="photo">{t("newEntry.photo")}</Label>
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="rounded-2xl"
          />
          <p className="text-sm text-muted-foreground">
            {t("newEntry.photoHint")}
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={locationError ? "text-destructive" : undefined}>
            {t("newEntry.location")}
          </Label>
          <MapClient
            interactive
            value={location}
            onChange={(val) => {
              setLocation(val)
              if (val) setLocationError(false)
            }}
          />
          {locationError && (
            <p className="text-sm text-destructive">
              {t("newEntry.errorNoLocation")}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="contact">{t("newEntry.contact")}</Label>
          <Input
            id="contact"
            name="contact"
            className="rounded-2xl"
            placeholder={t("newEntry.contactPlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {state === "error" ? t("newEntry.error") : null}
          </div>
          <Button
            type="submit"
            className="rounded-full"
            disabled={isSubmitting}
          >
            <Plus size={16} className="mr-2" />
            {isSubmitting ? t("common.saving") : t("newEntry.submit")}
          </Button>
        </div>
      </form>
    </div>
  )
}
