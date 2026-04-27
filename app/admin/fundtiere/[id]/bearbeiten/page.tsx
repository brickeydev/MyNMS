import AdminEntryEditForm from "@/components/admin/AdminEntryEditForm"

export const dynamic = "force-dynamic"

export default async function FundtiereEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fundtier bearbeiten</h1>
      <AdminEntryEditForm
        id={id}
        backHref="/admin/fundtiere"
        publicHref={`/de/eintraege/tiere/${id}`}
      />
    </div>
  )
}
