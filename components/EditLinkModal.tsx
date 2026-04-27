"use client"

import { useState } from "react"
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  open: boolean
  editUrl: string
  onClose: () => void
  onDone?: () => void
}

export default function EditLinkModal({ open, editUrl, onClose, onDone }: Props) {
  const t = useTranslations("editLink")
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(editUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("warning")}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("linkLabel")}</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={editUrl}
                className="rounded-2xl font-mono text-xs"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0 rounded-2xl"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              asChild
              className="rounded-full"
            >
              <a href={editUrl}>
                <ExternalLink size={14} className="mr-2" />
                {t("editNow")}
              </a>
            </Button>
            <Button onClick={onDone ?? onClose} className="rounded-full">
              {t("done")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
