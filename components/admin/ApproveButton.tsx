"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Trash2, XCircle } from "lucide-react"

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

interface Props {
  entryId: string
  entryName: string
  approved: number
}

export default function ApproveButton({ entryId, entryName, approved }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    await fetch(`/api/admin/directory/${entryId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: approved === 1 ? 0 : 1 }),
    })
    setBusy(false)
    router.refresh()
  }

  async function handleDelete() {
    setBusy(true)
    await fetch(`/api/admin/directory/${entryId}`, { method: "DELETE" })
    setBusy(false)
    router.push("/admin/vorgestellt")
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={toggle}
        disabled={busy}
        size="sm"
        className={`rounded-full ${
          approved === 0
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white"
        }`}
      >
        {approved === 0 ? (
          <>
            <CheckCircle2 size={16} className="mr-2" />
            Freigeben
          </>
        ) : (
          <>
            <XCircle size={16} className="mr-2" />
            Zurückziehen
          </>
        )}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-full"
          >
            <Trash2 size={16} className="mr-2" />
            Löschen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{entryName}" wird endgültig gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
