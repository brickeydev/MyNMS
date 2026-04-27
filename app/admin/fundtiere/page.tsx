import type { Metadata } from "next"
import AdminEntriesTable from "@/components/admin/AdminEntriesTable"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export const dynamic = "force-dynamic"

export default function AdminFundtierePage() {
  return <AdminEntriesTable category="tiere" title="Fundtiere" />
}
