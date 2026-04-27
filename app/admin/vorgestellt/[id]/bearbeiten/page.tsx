import AdminDirectoryEditForm from "@/components/admin/AdminDirectoryEditForm"

export const dynamic = "force-dynamic"

export default async function AdminVorgestelltEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vorgestellt-Eintrag bearbeiten</h1>
      <AdminDirectoryEditForm id={id} />
    </div>
  )
}
