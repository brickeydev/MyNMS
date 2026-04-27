"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

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

interface ResolveEntryButtonProps {
  entryId: number
}

export default function ResolveEntryButton({
  entryId,
}: ResolveEntryButtonProps) {
  const t = useTranslations("entryDetail")
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleResolve() {
    setIsPending(true)

    const token =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith(`owner_token_${entryId}=`))
        ?.split("=")[1] ?? ""

    const response = await fetch(`/api/entries/${entryId}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    setIsPending(false)

    if (!response.ok) {
      return
    }

    router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="rounded-full">
          <Plus size={16} className="mr-2" />
          {t("markResolved")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleResolve} disabled={isPending}>
            {t("confirmAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
