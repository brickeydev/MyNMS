"use client"

import { Suspense, useEffect, useState } from "react"
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"

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
import { Textarea } from "@/components/ui/textarea"
import { Link } from "@/i18n/navigation"
import type { EntryRecord } from "@/lib/types"

interface PageParams {
  params: Promise<{ locale: string; category: string; id: string }>
}

export default function EntryEditPage({ params }: PageParams) {
  return (
    <Suspense
      fallback={
        <div className="bubble-card h-96 animate-pulse bg-card/80" />
      }
    >
      <EntryEditContent params={params} />
    </Suspense>
  )
}

function EntryEditContent({ params }: PageParams) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("entryEdit")
  const tDetail = useTranslations("entryDetail")
  const tNew = useTranslations("newEntry")
  const tCommon = useTranslations("common")

  const [resolvedParams, setResolvedParams] = useState<{
    category: string
    id: string
  } | null>(null)
  const [entry, setEntry] = useState<EntryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )

  useEffect(() => {
    params.then((p) => setResolvedParams({ category: p.category, id: p.id }))
  }, [params])

  const token =
    searchParams.get("token") ??
    (typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) =>
            c.startsWith(`owner_token_${resolvedParams?.id}=`)
          )
          ?.split("=")[1] ?? ""
      : "")

  useEffect(() => {
    if (!resolvedParams) return
    fetch(`/api/entries/${resolvedParams.id}`)
      .then((r) => r.json())
      .then((data: EntryRecord) => {
        setEntry(data)
        if (data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng })
        }
      })
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false))
  }, [resolvedParams]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resolvedParams || !token) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("token", token)
    if (location) {
      formData.set("lat", String(location.lat))
      formData.set("lng", String(location.lng))
    }

    const res = await fetch(`/api/entries/${resolvedParams.id}`, {
      method: "PATCH",
      body: formData,
    })

    setSaving(false)

    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error === "forbidden" ? t("forbiddenError") : t("saveError"))
      return
    }
    setSuccess(true)
  }

  async function handleResolve() {
    if (!resolvedParams || !token) return
    setResolving(true)
    const res = await fetch(`/api/entries/${resolvedParams.id}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    setResolving(false)
    if (res.ok) {
      router.push(
        `/eintraege/${resolvedParams.category}/${resolvedParams.id}` as Parameters<
          typeof router.push
        >[0]
      )
    } else {
      setError(t("resolveError"))
    }
  }

  async function handleDelete() {
    if (!resolvedParams || !token) return
    setDeleting(true)
    const res = await fetch(
      `/api/entries/${resolvedParams.id}?token=${encodeURIComponent(token)}`,
      { method: "DELETE" }
    )
    setDeleting(false)
    if (res.ok) {
      router.push(
        `/eintraege/${resolvedParams.category}` as Parameters<
          typeof router.push
        >[0]
      )
    } else {
      setError(t("deleteError"))
    }
  }

  if (loading) {
    return (
      <div className="bubble-card flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="bubble-card">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link
            href={
              `/eintraege/${resolvedParams?.category ?? entry.category}/${entry.id}` as Parameters<
                typeof Link
              >[0]["href"]
            }
          >
            <ArrowLeft size={16} className="mr-2" />
            {t("backToView")}
          </Link>
        </Button>
      </div>

      <section className="bubble-card space-y-3">
        <h1 className="section-title">{tDetail("editEntry")}</h1>
        {!token && (
          <p className="text-sm text-destructive">{t("noToken")}</p>
        )}
      </section>

      <form
        onSubmit={handleSave}
        className="bubble-card grid gap-4 md:grid-cols-2"
      >
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">{tNew("titleField")} *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={entry.title}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">{tNew("descriptionField")} *</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={entry.description}
            className="min-h-32 rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="photo">{t("photoUpdate")}</Label>
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="rounded-2xl"
          />
          {entry.photo_path && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="removePhoto" value="true" />
              {t("photoRemove")}
            </label>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{tCommon("location")}</Label>
          <MapClient interactive value={location} onChange={setLocation} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="contact">{tCommon("contact")}</Label>
          <Input
            id="contact"
            name="contact"
            defaultValue={entry.contact ?? ""}
            className="rounded-2xl"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive md:col-span-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 md:col-span-2">
            {t("saveSuccess")}
          </p>
        )}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button
            type="submit"
            disabled={saving || !token}
            className="rounded-full"
          >
            <Save size={16} className="mr-2" />
            {saving ? t("saving") : tCommon("save")}
          </Button>

          {entry.status !== "erledigt" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={resolving || !token}
                  className="rounded-full"
                >
                  {resolving ? "…" : tDetail("markResolved")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tDetail("confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tDetail("confirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResolve}>
                    {tDetail("confirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || !token}
                className="rounded-full"
              >
                <Trash2 size={16} className="mr-2" />
                {deleting ? t("deleting") : t("deleteEntry")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
                >
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  )
}
