import type { Metadata } from "next"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"

import DirectoryBrowser from "@/components/DirectoryBrowser"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import type { DirectoryRecord } from "@/lib/types"

export const metadata: Metadata = {
  title: "Vorgestellt",
  description:
    "Lokale Unternehmen, Vereine, Initiativen und Kreative aus Neumünster.",
  alternates: { canonical: "https://mynms.de/de/vorgestellt" },
}

export const dynamic = "force-dynamic"

export default async function FeaturedPage() {
  const t = await getTranslations("directory")
  const entries = db
    .prepare(
      `
        SELECT *
        FROM directory
        WHERE approved = 1
        ORDER BY name COLLATE NOCASE ASC
      `
    )
    .all() as DirectoryRecord[]

  return (
    <div className="space-y-6">
      <section className="bubble-card flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-copy">{t("description")}</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/vorgestellt/vorschlag">
            <Plus size={16} className="mr-2" />
            {t("submit")}
          </Link>
        </Button>
      </section>

      <DirectoryBrowser entries={entries} />
    </div>
  )
}
