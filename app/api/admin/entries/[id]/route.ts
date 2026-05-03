import fs from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { SESSION_COOKIE, verifyAdminJWT } from "@/lib/auth"
import { db, PHOTO_DIR } from "@/lib/db"
import type { EntryRecord } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin(): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifyAdminJWT(token)
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"]

function validateImageMagicBytes(buf: Buffer): boolean {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true
  return false
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: "photo_too_large" }, { status: 400 })
    }
    if (!ALLOWED_PHOTO_MIME.includes(photo.type)) {
      return NextResponse.json({ error: "photo_invalid_mime" }, { status: 400 })
    }
    const buf = Buffer.from(await photo.arrayBuffer())
    if (!validateImageMagicBytes(buf)) {
      return NextResponse.json({ error: "photo_invalid_format" }, { status: 400 })
    }
    if (photoPath) await fs.unlink(path.join(PHOTO_DIR, photoPath)).catch(() => {})
    const ext = photo.type === "image/png" ? ".png" : photo.type === "image/webp" ? ".webp" : ".jpg"
    photoPath = `${randomUUID()}${ext}`
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
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
