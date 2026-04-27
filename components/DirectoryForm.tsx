"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"

import EditLinkModal from "@/components/EditLinkModal"
import OpeningHoursInput from "@/components/OpeningHoursInput"
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
  type OpeningHours,
  defaultOpeningHours,
} from "@/lib/types"

const categoryMessageKeys: Record<DirectoryCategory, string> = {
  kultur: "culture",
  sport: "sport",
  vereine: "clubs",
  sonstiges: "other",
}

export default function DirectoryForm() {
  const t = useTranslations("directory")
  const common = useTranslations("common")
  const router = useRouter()
  const [formCategory, setFormCategory] =
    useState<DirectoryCategory>("kultur")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<"idle" | "error">("idle")
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    defaultOpeningHours()
  )
  const [editUrl, setEditUrl] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setState("idle")

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("category", formCategory)
    formData.set("opening_hours", JSON.stringify(openingHours))
    formData.delete("opening_hours_hidden")

    const street = ((formData.get("_street") as string) ?? "").trim()
    const plz = ((formData.get("_plz") as string) ?? "").trim()
    const city = ((formData.get("_city") as string) ?? "").trim()
    const address = [street, [plz, city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join("\n")
    formData.set("address", address)
    formData.delete("_street")
    formData.delete("_plz")
    formData.delete("_city")

    const response = await fetch("/api/directory", {
      method: "POST",
      body: formData,
    })

    setIsSubmitting(false)

    if (!response.ok) {
      setState("error")
      return
    }

    const payload = (await response.json()) as { id: number; token: string }

    const url = `${window.location.origin}/vorgestellt/${payload.id}/bearbeiten?token=${payload.token}`
    setEditUrl(url)

    form.reset()
    setFormCategory("kultur")
    setOpeningHours(defaultOpeningHours())
  }

  return (
    <>
      {editUrl && (
        <EditLinkModal
          open={true}
          editUrl={editUrl}
          onClose={() => setEditUrl(null)}
          onDone={() => router.push("/vorgestellt")}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bubble-card grid gap-4 md:grid-cols-2"
        encType="multipart/form-data"
      >
        <div className="space-y-2">
          <Label>{t("category")} *</Label>
          <Select
            value={formCategory}
            onValueChange={(value) =>
              setFormCategory(value as DirectoryCategory)
            }
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTORY_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(categoryMessageKeys[category])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{t("name")} *</Label>
          <Input id="name" name="name" required className="rounded-2xl" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">{t("descriptionField")} *</Label>
          <Textarea
            id="description"
            name="description"
            required
            className="min-h-28 rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logo">{t("logo")}</Label>
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="rounded-2xl"
          />
          <p className="text-xs text-muted-foreground">
            {t("logoHint")}
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addr_street">{t("addressStreet")}</Label>
          <Input id="addr_street" name="_street" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_plz">{t("addressPlz")}</Label>
          <Input id="addr_plz" name="_plz" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr_city">{t("addressCity")}</Label>
          <Input id="addr_city" name="_city" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t("websiteField")}</Label>
          <Input id="website" name="website" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneField")}</Label>
          <Input id="phone" name="phone" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("emailField")}</Label>
          <Input id="email" name="email" type="email" className="rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_instagram">{t("instagram")}</Label>
          <Input
            id="social_instagram"
            name="social_instagram"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_facebook">{t("facebook")}</Label>
          <Input
            id="social_facebook"
            name="social_facebook"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_tiktok">{t("tiktok")}</Label>
          <Input
            id="social_tiktok"
            name="social_tiktok"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_youtube">{t("youtube")}</Label>
          <Input
            id="social_youtube"
            name="social_youtube"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_spotify">{t("spotify")}</Label>
          <Input
            id="social_spotify"
            name="social_spotify"
            placeholder={t("spotifyPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_soundcloud">{t("soundcloud")}</Label>
          <Input
            id="social_soundcloud"
            name="social_soundcloud"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social_linkedin">{t("linkedin")}</Label>
          <Input
            id="social_linkedin"
            name="social_linkedin"
            placeholder={t("socialPlaceholder")}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{t("openingHoursField")}</Label>
          <OpeningHoursInput
            value={openingHours}
            onChange={setOpeningHours}
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {state === "error" ? t("error") : null}
          </div>
          <Button
            type="submit"
            className="rounded-full"
            disabled={isSubmitting}
          >
            <Plus size={16} className="mr-2" />
            {isSubmitting ? common("saving") : t("submit")}
          </Button>
        </div>
      </form>
    </>
  )
}
