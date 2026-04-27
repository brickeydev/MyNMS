import type { Metadata } from "next"
import { Suspense } from "react"

import NewEntryForm from "@/components/NewEntryForm"

export const metadata: Metadata = {
  title: "Neuer Eintrag",
  description: "Tier oder Gegenstand als vermisst oder gefunden melden.",
  alternates: { canonical: "https://mynms.de/de/neu" },
}

export default function NewEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="bubble-card h-[720px] animate-pulse bg-card/80" />
      }
    >
      <NewEntryForm />
    </Suspense>
  )
}
