"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, Eye, Pencil, Trash2 } from "lucide-react"
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
import type { EntryCategory, EntryRecord, EntryStatus, EntryType } from "@/lib/types"

interface Props {
  category: EntryCategory
  title: string
}

export default function AdminEntriesTable({ category, title }: Props) {
  const [entries, setEntries] = useState<EntryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all")

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ category })
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (typeFilter !== "all") params.set("type", typeFilter)
    const res = await fetch(`/api/admin/entries?${params}`)
    const data = (await res.json()) as EntryRecord[]
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, statusFilter, typeFilter])

  async function handleResolve(id: number) {
    await fetch(`/api/admin/entries/${id}/resolve`, { method: "PATCH" })
    await load()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/entries/${id}`, { method: "DELETE" })
    await load()
  }

  const editBase = category === "tiere" ? "/admin/fundtiere" : "/admin/fundsachen"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="erledigt">Erledigt</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="vermisst">Vermisst</SelectItem>
              <SelectItem value="gefunden">Gefunden</SelectItem>
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
                <th className="px-4 py-3 font-medium">Titel</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Erstellt am</th>
                <th className="px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    #{entry.id}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-medium">
                    {entry.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {entry.type === "vermisst" ? "Vermisst" : "Gefunden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        entry.status === "erledigt" ? "secondary" : "default"
                      }
                    >
                      {entry.status === "erledigt" ? "Erledigt" : "Offen"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          href={`/de/eintraege/${entry.category}/${entry.id}`}
                          target="_blank"
                        >
                          <Eye size={15} />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link href={`${editBase}/${entry.id}/bearbeiten`}>
                          <Pencil size={15} />
                        </Link>
                      </Button>
                      {entry.status !== "erledigt" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <CheckCircle size={15} className="text-green-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Als erledigt markieren?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Eintrag „{entry.title}" als erledigt markieren.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleResolve(entry.id)}
                              >
                                Ja
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <Trash2 size={15} className="text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eintrag löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              „{entry.title}" wird endgültig gelöscht.
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
