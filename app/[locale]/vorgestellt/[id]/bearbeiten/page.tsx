"use client"

import { Suspense, useEffect, useState } from "react"
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
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
import { Link } from "@/i18n/navigation"
import {
  DIRECTORY_CATEGORIES,
  type DirectoryCategory,
  type DirectoryRecord,
  type OpeningHours,
} from "@/lib/types"

interface PageParams {
  params: Promise<{ locale: string; id: string }>
}

export default function DirectoryEditPage({ params }: PageParams) {
  return (
    <Suspense
      fallback={<div className="bubble-card h-96 animate-pulse bg-card/80" />}
    >
      <DirectoryEditContent params={params} />
    </Suspense>
  )
}

function DirectoryEditContent({ params }: PageParams) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("directory")
  const tEdit = useTranslations("entryEdit")
  const tCommon = useTranslations("common")

  const categoryMessageKeys: Record<DirectoryCategory, string> = {
    kultur: "culture",
    sport: "sport",
    handwerk: "handwerk",
    vereine: "clubs",
    sonstiges: "other",
  }

  const [entryId, setEntryId] = useState<string | null>(null)
  const [entry, setEntry] = useState<DirectoryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [category, setCategory] = useState<DirectoryCategory>("kultur")
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    parseOpeningHours(null)
  )
  const [street, setStreet] = useState("")
  const [plz, setPlz] = useState("")
  const [city, setCity] = useState("")

  useEffect(() => {
    params.then((p) => setEntryId(p.id))
  }, [params])

  const token =
    searchParams.get("token") ??
    (typeof document !== "undefined" && entryId
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith(`owner_token_${entryId}=`))
          ?.split("=")[1] ?? ""
      : "")

  useEffect(() => {
    if (!entryId) return
    fetch(`/api/directory/${entryId}`)
      .then((r) => r.json())
      .then((data: DirectoryRecord) => {
        setEntry(data)
        setCategory(data.category)
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
      .catch(() => setError(tEdit("loadError")))
      .finally(() => setLoading(false))
  }, [entryId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!entryId || !token) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("token", token)
    formData.set("category", category)
    formData.set("opening_hours", JSON.stringify(openingHours))
    const address = [street.trim(), [plz.trim(), city.trim()].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join("\n")
    formData.set("address", address)

    const res = await fetch(`/api/directory/${entryId}`, {
      method: "PATCH",
      body: formData,
    })

    setSaving(false)
    if (!res.ok) {
      const body = (await res.json()) as { error?: string }
      setError(body.error === "forbidden" ? tEdit("forbiddenError") : tEdit("saveError"))
      return
    }
    setSuccess(true)
  }

  async function handleDelete() {
    if (!entryId || !token) return
    setDeleting(true)
    const res = await fetch(
      `/api/directory/${entryId}?token=${encodeURIComponent(token)}`,
      { method: "DELETE" }
    )
    setDeleting(false)
    if (res.ok) {
      router.push("/vorgestellt" as Parameters<typeof router.push>[0])
    } else {
      setError(tEdit("deleteError"))
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
        <p className="text-muted-foreground">{tEdit("notFound")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/vorgestellt">
            <ArrowLeft size={16} className="mr-2" />
            {tCommon("backToList")}
          </Link>
        </Button>
      </div>

      <section className="bubble-card space-y-3">
        <h1 className="section-title">{t("edit")}</h1>
        {!token && (
          <p className="text-sm text-destructive">{tEdit("noToken")}</p>
        )}
      </section>

      <form
        onSubmit={handleSave}
        className="bubble-card grid gap-4 md:grid-cols-2"
        encType="multipart/form-data"
      >
        <div className="space-y-2">
          <Label>{t("category")} *</Label>
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
                  {t(categoryMessageKeys[c])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{t("name")} *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={entry.name}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">{t("descriptionField")} *</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={entry.description}
            className="min-h-28 rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logo">{t("logo")}</Label>
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
                {t("logoRemove")}
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
          <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addr_street">{t("addressStreet")}</Label>
          <Input
            id="addr_street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_plz">{t("addressPlz")}</Label>
          <Input
            id="addr_plz"
            value={plz}
            onChange={(e) => setPlz(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_city">{t("addressCity")}</Label>
          <Input
            id="addr_city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t("websiteField")}</Label>
          <Input
            id="website"
            name="website"
            defaultValue={entry.website ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneField")}</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={entry.phone ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("emailField")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={entry.email ?? ""}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_instagram">{t("instagram")}</Label>
          <Input
            id="social_instagram"
            name="social_instagram"
            defaultValue={entry.social_instagram ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_facebook">{t("facebook")}</Label>
          <Input
            id="social_facebook"
            name="social_facebook"
            defaultValue={entry.social_facebook ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_tiktok">{t("tiktok")}</Label>
          <Input
            id="social_tiktok"
            name="social_tiktok"
            defaultValue={entry.social_tiktok ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_youtube">{t("youtube")}</Label>
          <Input
            id="social_youtube"
            name="social_youtube"
            defaultValue={entry.social_youtube ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_spotify">{t("spotify")}</Label>
          <Input
            id="social_spotify"
            name="social_spotify"
            defaultValue={entry.social_spotify ?? ""}
            placeholder={t("spotifyPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_soundcloud">{t("soundcloud")}</Label>
          <Input
            id="social_soundcloud"
            name="social_soundcloud"
            defaultValue={entry.social_soundcloud ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_linkedin">{t("linkedin")}</Label>
          <Input
            id="social_linkedin"
            name="social_linkedin"
            defaultValue={entry.social_linkedin ?? ""}
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{tCommon("openingHours")}</Label>
          <OpeningHoursInput value={openingHours} onChange={setOpeningHours} />
        </div>

        {error && (
          <p className="text-sm text-destructive md:col-span-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 md:col-span-2">
            {tEdit("saveSuccess")}
          </p>
        )}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button
            type="submit"
            disabled={saving || !token}
            className="rounded-full"
          >
            <Save size={16} className="mr-2" />
            {saving ? tEdit("saving") : tCommon("save")}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || !token}
                className="rounded-full"
              >
                <Trash2 size={16} className="mr-2" />
                {deleting ? tEdit("deleting") : tEdit("deleteEntry")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tEdit("deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tEdit("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
                >
                  {tEdit("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  )
}
