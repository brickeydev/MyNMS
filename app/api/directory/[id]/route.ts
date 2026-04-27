import { timingSafeEqual, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, LOGO_DIR } from "@/lib/db"
import type { DirectoryRecord } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LOGO_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))
  } catch {
    return false
  }
}

function validateImageMagicBytes(buf: Buffer): boolean {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return true
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return true
  return false
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
      "SELECT id, owner_token, logo_path FROM directory WHERE id = ?"
    )
    .get(Number(id)) as
    | (Pick<DirectoryRecord, "id" | "logo_path"> & {
        owner_token: string | null
      })
    | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (!existing.owner_token || !safeCompare(token, existing.owner_token)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!name || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  let logoPath = existing.logo_path
  const removeLogo = formData.get("removeLogo") === "true"
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
      return NextResponse.json(
        { error: "logo_invalid_format" },
        { status: 400 }
      )
    }
    if (logoPath) await fs.unlink(path.join(LOGO_DIR, logoPath)).catch(() => {})
    const ext =
      logoFile.type === "image/png"
        ? ".png"
        : logoFile.type === "image/webp"
          ? ".webp"
          : ".jpg"
    logoPath = `${randomUUID()}${ext}`
    await fs.mkdir(LOGO_DIR, { recursive: true })
    await fs.writeFile(path.join(LOGO_DIR, logoPath), buf)
  }

  const lat = formData.get("lat")
  const lng = formData.get("lng")
  const latNum = lat !== null ? Number(lat) : null
  const lngNum = lng !== null ? Number(lng) : null

  db.prepare(
    `UPDATE directory SET
      name = ?, description = ?, logo_path = ?, address = ?, website = ?,
      phone = ?, email = ?, social_instagram = ?, social_facebook = ?,
      social_spotify = ?, social_tiktok = ?, social_soundcloud = ?,
      social_youtube = ?, social_linkedin = ?,
      opening_hours = ?, lat = ?, lng = ?
     WHERE id = ?`
  ).run(
    name,
    description,
    logoPath,
    String(formData.get("address") ?? "").trim() || null,
    String(formData.get("website") ?? "").trim() || null,
    String(formData.get("phone") ?? "").trim() || null,
    String(formData.get("email") ?? "").trim() || null,
    String(formData.get("social_instagram") ?? "").trim() || null,
    String(formData.get("social_facebook") ?? "").trim() || null,
    String(formData.get("social_spotify") ?? "").trim() || null,
    String(formData.get("social_tiktok") ?? "").trim() || null,
    String(formData.get("social_soundcloud") ?? "").trim() || null,
    String(formData.get("social_youtube") ?? "").trim() || null,
    String(formData.get("social_linkedin") ?? "").trim() || null,
    String(formData.get("opening_hours") ?? "").trim() || null,
    latNum !== null && Number.isFinite(latNum) ? latNum : null,
    lngNum !== null && Number.isFinite(lngNum) ? lngNum : null,
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
    .prepare("SELECT id, owner_token, logo_path FROM directory WHERE id = ?")
    .get(Number(id)) as
    | (Pick<DirectoryRecord, "id" | "logo_path"> & {
        owner_token: string | null
      })
    | undefined

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (!existing.owner_token || !safeCompare(token, existing.owner_token)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  if (existing.logo_path) {
    await fs.unlink(path.join(LOGO_DIR, existing.logo_path)).catch(() => {})
  }

  db.prepare("DELETE FROM directory WHERE id = ?").run(Number(id))

  return NextResponse.json({ ok: true })
}
