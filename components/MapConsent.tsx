"use client"

import { useState, useEffect } from "react"
import { Map, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const CONSENT_KEY = "osm_consent"

interface MapConsentProps {
  children: React.ReactNode
  className?: string
}

export default function MapConsent({ children, className }: MapConsentProps) {
  const t = useTranslations("map")
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)

  useEffect(() => {
    setHasConsent(localStorage.getItem(CONSENT_KEY) === "true")
  }, [])

  const handleConsent = () => {
    localStorage.setItem(CONSENT_KEY, "true")
    setHasConsent(true)
  }

  if (hasConsent === null) {
    return (
      <div
        className={cn(
          "map-shell h-[320px] animate-pulse bg-secondary/60",
          className
        )}
      />
    )
  }

  if (!hasConsent) {
    return (
      <div
        className={cn(
          "map-shell flex h-[320px] flex-col items-center justify-center gap-4 bg-muted p-6 text-center",
          className
        )}
      >
        <Map size={48} className="text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{t("consentTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("consentText")}{" "}
            <Link
              href="/datenschutz"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("privacyLink")}
            </Link>
            .
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleConsent}
          className="rounded-full gap-2"
        >
          {t("loadButton")}
          <ArrowRight size={16} />
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
