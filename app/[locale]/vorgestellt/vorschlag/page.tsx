import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

import DirectoryForm from "@/components/DirectoryForm"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default async function SuggestPage() {
  const t = await getTranslations("directory")

  return (
    <div className="space-y-6">
      <section className="bubble-card space-y-3">
        <Button asChild variant="outline" className="-ml-2 rounded-full">
          <Link href="/vorgestellt">
            <ArrowLeft size={16} className="mr-2" />
            {t("title")}
          </Link>
        </Button>
        <h1 className="section-title">{t("suggestTitle")}</h1>
        <p className="section-copy">{t("suggestDescription")}</p>
      </section>

      <DirectoryForm />
    </div>
  )
}
