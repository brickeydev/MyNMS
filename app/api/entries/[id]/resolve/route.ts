import { timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { EntryRecord } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))
  } catch {
    return false
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let token = ""
  try {
    const body = (await request.json()) as { token?: string }
    token = body.token ?? ""
  } catch {
    // token optional for backward compatibility
  }

  const existing = db
    .prepare("SELECT id, owner_token FROM entries WHERE id = ?")
    .get(Number(id)) as
    | (Pick<EntryRecord, "id"> & { owner_token: string | null })
    | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (existing.owner_token && token) {
    if (!safeCompare(token, existing.owner_token)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
  }

  const result = db
    .prepare("UPDATE entries SET status = 'erledigt' WHERE id = ?")
    .run(Number(id))

  if (result.changes === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
