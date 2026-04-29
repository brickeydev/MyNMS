"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Eye, Pencil, Trash2, XCircle } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DIRECTORY_CATEGORIES, type DirectoryCategory, type DirectoryRecord } from "@/lib/types"

const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  kultur: "Kultur & Kreative",
  sport: "Sport & Gesundheit",
  handwerk: "Handwerk & Dienstleistungen",
  vereine: "Vereine & Initiativen",
  sonstiges: "Sonstiges",
}

export default function AdminDirectoryTable() {
  const [entries, setEntries] = useState<DirectoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<DirectoryCategory | "all">("all")
  const [approvedFilter, setApprovedFilter] = useState<"all" | "0" | "1">("all")

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (categoryFilter !== "all") params.set("category", categoryFilter)
    if (approvedFilter !== "all") params.set("approved", approvedFilter)
    const res = await fetch(`/api/admin/directory?${params}`)
    const data = (await res.json()) as DirectoryRecord[]
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, approvedFilter])

  async function handleApprove(id: number, value: 1 | 0) {
    await fetch(`/api/admin/directory/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: value }),
    })
    await load()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/directory/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Vorgestellt</h1>
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {DIRECTORY_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={approvedFilter}
            onValueChange={(v) => setApprovedFilter(v as typeof approvedFilter)}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="0">Ausstehend</SelectItem>
              <SelectItem value="1">Freigegeben</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Wird geladen…
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Keine Einträge gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kategorie</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Erstellt am</th>
                <th className="px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isPending = entry.approved === 0
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-border last:border-0 ${
                      isPending
                        ? "bg-amber-50/40 dark:bg-amber-950/10"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      #{entry.id}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium">
                      <Link
                        href={`/admin/vorgestellt/${entry.id}`}
                        className="hover:underline"
                      >
                        {entry.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {CATEGORY_LABELS[entry.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={entry.approved === 1 ? "default" : "secondary"}
                        className={
                          isPending
                            ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : ""
                        }
                      >
                        {entry.approved === 1 ? "Freigegeben" : "Ausstehend"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/admin/vorgestellt/${entry.id}`}>
                            <Eye size={15} />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link
                            href={`/admin/vorgestellt/${entry.id}/bearbeiten`}
                          >
                            <Pencil size={15} />
                          </Link>
                        </Button>
                        {entry.approved === 0 ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApprove(entry.id, 1)}
                          >
                            <CheckCircle2
                              size={15}
                              className="text-green-600"
                            />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleApprove(entry.id, 0)}
                          >
                            <XCircle size={15} className="text-amber-600" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <Trash2
                                size={15}
                                className="text-destructive"
                              />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Eintrag löschen?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                „{entry.name}" wird endgültig gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(entry.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
