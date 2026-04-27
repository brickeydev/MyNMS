"use client"

import { Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { AppLocale } from "@/lib/types"

const locales: AppLocale[] = ["de", "en", "tr"]

export default function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("language")

  function handleSwitch(nextLocale: AppLocale) {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full border border-transparent hover:border-border"
          aria-label={t("label")}
          title={t("label")}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((item) => (
          <DropdownMenuItem
            key={item}
            className={locale === item ? "text-primary" : undefined}
            onClick={() => handleSwitch(item)}
          >
            {t(item)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
