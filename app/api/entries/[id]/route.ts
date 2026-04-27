import { timingSafeEqual } from "node:crypto"
import fs from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, PHOTO_DIR } from "@/lib/db"
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

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-")
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formData = await request.formData()
  const token = String(formData.get("token") ?? "").trim()

  const existing = db
    .prepare(
      "SELECT id, owner_token, photo_path FROM entries WHERE id = ?"
    )
    .get(Number(id)) as Pick<EntryRecord, "id" | "photo_path"> & {
    owner_token: string | null
  } | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (!existing.owner_token || !safeCompare(token, existing.owner_token)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const contact = String(formData.get("contact") ?? "").trim() || null
  const lat = formData.get("lat")
  const lng = formData.get("lng")
  const photo = formData.get("photo")
  const removePhoto = formData.get("removePhoto") === "true"

  if (!title || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  let photoPath = existing.photo_path

  if (removePhoto && photoPath) {
    await fs.unlink(path.join(PHOTO_DIR, photoPath)).catch(() => {})
    photoPath = null
  } else if (photo instanceof File && photo.size > 0) {
    if (photoPath) {
      await fs.unlink(path.join(PHOTO_DIR, photoPath)).catch(() => {})
    }
    const extension = path.extname(photo.name) || ".jpg"
    photoPath = `${randomUUID()}-${sanitizeFileName(`photo${extension}`)}`
    const buffer = Buffer.from(await photo.arrayBuffer())
    await fs.mkdir(PHOTO_DIR, { recursive: true })
    await fs.writeFile(path.join(PHOTO_DIR, photoPath), buffer)
  }

  const latNum = lat !== null ? Number(lat) : null
  const lngNum = lng !== null ? Number(lng) : null

  db.prepare(
    `UPDATE entries SET title = ?, description = ?, contact = ?, lat = ?, lng = ?, photo_path = ?
     WHERE id = ?`
  ).run(
    title,
    description,
    contact,
    latNum !== null && Number.isFinite(latNum) ? latNum : null,
    lngNum !== null && Number.isFinite(lngNum) ? lngNum : null,
    photoPath,
    Number(id)
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  let token = searchParams.get("token") ?? ""

  if (!token) {
    try {
      const body = (await request.json()) as { token?: string }
      token = body.token ?? ""
    } catch {
      // token may come as query param only
    }
  }

  const existing = db
    .prepare("SELECT id, owner_token, photo_path FROM entries WHERE id = ?")
    .get(Number(id)) as
    | (Pick<EntryRecord, "id" | "photo_path"> & {
        owner_token: string | null
      })
    | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (!existing.owner_token || !safeCompare(token, existing.owner_token)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (existing.photo_path) {
    await fs.unlink(path.join(PHOTO_DIR, existing.photo_path)).catch(() => {})
  }

  db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id))

  return NextResponse.json({ ok: true })
}
