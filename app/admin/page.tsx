import type { Metadata } from "next"
import Link from "next/link"
import { Cat, Package, Star } from "lucide-react"

import { db } from "@/lib/db"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default function AdminOverviewPage() {
  const pendingDirectory = (
    db
      .prepare("SELECT COUNT(*) as count FROM directory WHERE approved = 0")
      .get() as { count: number }
  ).count

  const openFundtiere = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM entries WHERE category = 'tiere' AND status = 'offen'"
      )
      .get() as { count: number }
  ).count

  const openFundsachen = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM entries WHERE category = 'gegenstaende' AND status = 'offen'"
      )
      .get() as { count: number }
  ).count

  const cards = [
    {
      href: "/admin/fundtiere",
      label: "Fundtiere",
      count: openFundtiere,
      sub: "offen",
      icon: Cat,
    },
    {
      href: "/admin/fundsachen",
      label: "Fundsachen",
      count: openFundsachen,
      sub: "offen",
      icon: Package,
    },
    {
      href: "/admin/vorgestellt",
      label: "Vorgestellt",
      count: pendingDirectory,
      sub: "ausstehend",
      icon: Star,
      highlight: pendingDirectory > 0,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Übersicht</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ href, label, count, sub, icon: Icon, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 rounded-2xl border p-5 transition-colors hover:bg-muted ${
              highlight ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-card"
            }`}
          >
            <div
              className={`rounded-xl p-3 ${
                highlight ? "bg-amber-100 dark:bg-amber-900/40" : "bg-secondary"
              }`}
            >
              <Icon size={22} />
            </div>
            <div>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground">
                {label} · {sub}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
