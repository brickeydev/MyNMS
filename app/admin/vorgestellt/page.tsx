import type { Metadata } from "next"
import AdminDirectoryTable from "@/components/admin/AdminDirectoryTable"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export const dynamic = "force-dynamic"

export default function AdminVorgestelltPage() {
  return <AdminDirectoryTable />
}
