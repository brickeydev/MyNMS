import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let approved = 1
  try {
    const body = (await request.json()) as { approved?: number }
    if (body.approved !== undefined) {
      approved = Number(body.approved)
    }
  } catch {
    // default to approve
  }

  const result = db
    .prepare("UPDATE directory SET approved = ? WHERE id = ?")
    .run(approved, Number(id))

  if (result.changes === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
