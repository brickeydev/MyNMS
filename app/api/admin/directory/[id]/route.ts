import fs from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, LOGO_DIR } from "@/lib/db"
import type { DirectoryRecord } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LOGO_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

function validateImageMagicBytes(buf: Buffer): boolean {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return true
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return true
  return false
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const entry = db
    .prepare(
      `SELECT id, created_at, category, name, description, logo_path, address, website,
              phone, email, social_instagram, social_facebook, social_spotify, social_tiktok,
              social_soundcloud, social_youtube, social_linkedin, opening_hours, lat, lng, approved
       FROM directory WHERE id = ?`
    )
    .get(Number(id)) as DirectoryRecord | undefined

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
  const contentType = request.headers.get("content-type") ?? ""

  const existing = db
    .prepare("SELECT id, logo_path FROM directory WHERE id = ?")
    .get(Number(id)) as
    | Pick<DirectoryRecord, "id" | "logo_path">
    | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  let fields: Record<string, string> = {}
  let logoPath = existing.logo_path

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    for (const [key, val] of formData.entries()) {
      if (typeof val === "string") fields[key] = val
    }

    const removeLogo = fields.removeLogo === "true"
    const logoFile = formData.get("logo") as File | null

    if (removeLogo && logoPath) {
      await fs.unlink(path.join(LOGO_DIR, logoPath)).catch(() => {})
      logoPath = null
    } else if (logoFile instanceof File && logoFile.size > 0) {
      if (logoFile.size > MAX_LOGO_SIZE) {
        return NextResponse.json({ error: "logo_too_large" }, { status: 400 })
      }
      if (!ALLOWED_MIME.includes(logoFile.type)) {
        return NextResponse.json({ error: "logo_invalid_mime" }, { status: 400 })
      }
      const buf = Buffer.from(await logoFile.arrayBuffer())
      if (!validateImageMagicBytes(buf)) {
        return NextResponse.json({ error: "logo_invalid_format" }, { status: 400 })
      }
      if (logoPath) await fs.unlink(path.join(LOGO_DIR, logoPath)).catch(() => {})
      const ext =
        logoFile.type === "image/png" ? ".png"
        : logoFile.type === "image/webp" ? ".webp"
        : ".jpg"
      logoPath = `${randomUUID()}${ext}`
      await fs.mkdir(LOGO_DIR, { recursive: true })
      await fs.writeFile(path.join(LOGO_DIR, logoPath), buf)
    }
  } else {
    fields = (await request.json()) as Record<string, string>
  }

  const name = (fields.name ?? "").trim()
  const description = (fields.description ?? "").trim()

  if (!name || !description) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
  }

  const approved = fields.approved !== undefined
    ? Number(fields.approved)
    : undefined
  const lat = fields.lat ? Number(fields.lat) : null
  const lng = fields.lng ? Number(fields.lng) : null

  db.prepare(
    `UPDATE directory SET
      name = ?, description = ?, logo_path = ?, address = ?, website = ?,
      phone = ?, email = ?, social_instagram = ?, social_facebook = ?,
      social_spotify = ?, social_tiktok = ?, social_soundcloud = ?,
      social_youtube = ?, social_linkedin = ?,
      opening_hours = ?, lat = ?, lng = ?${approved !== undefined ? ", approved = ?" : ""}
     WHERE id = ?`
  ).run(
    ...[
      name,
      description,
      logoPath,
      fields.address?.trim() || null,
      fields.website?.trim() || null,
      fields.phone?.trim() || null,
      fields.email?.trim() || null,
      fields.social_instagram?.trim() || null,
      fields.social_facebook?.trim() || null,
      fields.social_spotify?.trim() || null,
      fields.social_tiktok?.trim() || null,
      fields.social_soundcloud?.trim() || null,
      fields.social_youtube?.trim() || null,
      fields.social_linkedin?.trim() || null,
      fields.opening_hours?.trim() || null,
      lat !== null && Number.isFinite(lat) ? lat : null,
      lng !== null && Number.isFinite(lng) ? lng : null,
      ...(approved !== undefined ? [approved] : []),
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
    .prepare("SELECT id, logo_path FROM directory WHERE id = ?")
    .get(Number(id)) as Pick<DirectoryRecord, "id" | "logo_path"> | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (existing.logo_path) {
    await fs.unlink(path.join(LOGO_DIR, existing.logo_path)).catch(() => {})
  }

  db.prepare("DELETE FROM directory WHERE id = ?").run(Number(id))

  return NextResponse.json({ ok: true })
}
