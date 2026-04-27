import fs from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, PHOTO_DIR } from "@/lib/db"
import type { EntryRecord } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const entry = db
    .prepare(
      `SELECT id, created_at, category, type, title, description,
              photo_path, lat, lng, contact, status
       FROM entries WHERE id = ?`
    )
    .get(Number(id)) as EntryRecord | undefined

  if (!entry) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json(entry)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formData = await request.formData()

  const existing = db
    .prepare("SELECT id, photo_path FROM entries WHERE id = ?")
    .get(Number(id)) as Pick<EntryRecord, "id" | "photo_path"> | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!title || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  let photoPath = existing.photo_path
  const removePhoto = formData.get("removePhoto") === "true"
  const photo = formData.get("photo") as File | null

  if (removePhoto && photoPath) {
    await fs.unlink(path.join(PHOTO_DIR, photoPath)).catch(() => {})
    photoPath = null
  } else if (photo instanceof File && photo.size > 0) {
    if (photoPath)
      await fs.unlink(path.join(PHOTO_DIR, photoPath)).catch(() => {})
    const extension = path.extname(photo.name) || ".jpg"
    photoPath = `${randomUUID()}-${sanitizeFileName(`photo${extension}`)}`
    const buf = Buffer.from(await photo.arrayBuffer())
    await fs.mkdir(PHOTO_DIR, { recursive: true })
    await fs.writeFile(path.join(PHOTO_DIR, photoPath), buf)
  }

  const lat = formData.get("lat")
  const lng = formData.get("lng")
  const latNum = lat !== null ? Number(lat) : null
  const lngNum = lng !== null ? Number(lng) : null
  const status = String(formData.get("status") ?? "").trim() || undefined

  const setStatus = status === "offen" || status === "erledigt" ? status : undefined

  db.prepare(
    `UPDATE entries SET title = ?, description = ?, contact = ?, lat = ?, lng = ?,
     photo_path = ?${setStatus ? ", status = ?" : ""} WHERE id = ?`
  ).run(
    ...[
      title,
      String(formData.get("description") ?? "").trim(),
      String(formData.get("contact") ?? "").trim() || null,
      latNum !== null && Number.isFinite(latNum) ? latNum : null,
      lngNum !== null && Number.isFinite(lngNum) ? lngNum : null,
      photoPath,
      ...(setStatus ? [setStatus] : []),
      Number(id),
    ]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = db
    .prepare("SELECT id, photo_path FROM entries WHERE id = ?")
    .get(Number(id)) as Pick<EntryRecord, "id" | "photo_path"> | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (existing.photo_path) {
    await fs
      .unlink(path.join(PHOTO_DIR, existing.photo_path))
      .catch(() => {})
  }

  db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id))

  return NextResponse.json({ ok: true })
}
