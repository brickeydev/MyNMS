import type { Metadata } from "next"
import AdminEntriesTable from "@/components/admin/AdminEntriesTable"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export const dynamic = "force-dynamic"

export default function AdminFundsachenPage() {
  return <AdminEntriesTable category="gegenstaende" title="Fundsachen" />
}
