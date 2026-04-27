import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = db
    .prepare("UPDATE entries SET status = 'erledigt' WHERE id = ?")
    .run(Number(id))

  if (result.changes === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
