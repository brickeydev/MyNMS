import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, PHOTO_DIR } from "@/lib/db"
import { checkPostRateLimit } from "@/lib/ratelimit"
import type { EntryCategory, EntryType } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const type = searchParams.get("type")
  const status = searchParams.get("status")

  const query = [
    "SELECT id, created_at, category, type, title, description, photo_path, lat, lng, contact, status FROM entries",
  ]
  const conditions: string[] = []
  const values: string[] = []

  if (category) {
    conditions.push("category = ?")
    values.push(category)
  }
  if (type) {
    conditions.push("type = ?")
    values.push(type)
  }
  if (status) {
    conditions.push("status = ?")
    values.push(status)
  }

  if (conditions.length > 0) {
    query.push(`WHERE ${conditions.join(" AND ")}`)
  }

  query.push("ORDER BY datetime(created_at) DESC")

  const entries = db.prepare(query.join(" ")).all(...values)
  return NextResponse.json(entries)
}

const VALID_CATEGORIES: EntryCategory[] = ["tiere", "gegenstaende"]
const VALID_TYPES: EntryType[] = ["vermisst", "gefunden"]

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  const rl = checkPostRateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    )
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 400 })
  }

  const formData = await request.formData()
  const category = formData.get("category") as EntryCategory | null
  const type = formData.get("type") as EntryType | null
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const contact = String(formData.get("contact") ?? "").trim() || null
  const lat = Number(formData.get("lat"))
  const lng = Number(formData.get("lng"))
  const photo = formData.get("photo")

  if (!category || !VALID_CATEGORIES.includes(category) || !type || !VALID_TYPES.includes(type) || !title || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  if (title.length > 100) {
    return NextResponse.json({ error: "title_too_long" }, { status: 400 })
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "description_too_long" }, { status: 400 })
  }
  if (contact && contact.length > 200) {
    return NextResponse.json({ error: "contact_too_long" }, { status: 400 })
  }

  let photoPath: string | null = null

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: "photo_too_large" }, { status: 400 })
    }
    if (!ALLOWED_PHOTO_MIME.includes(photo.type)) {
      return NextResponse.json({ error: "photo_invalid_mime" }, { status: 400 })
    }
    const buffer = Buffer.from(await photo.arrayBuffer())
    if (!validateImageMagicBytes(buffer)) {
      return NextResponse.json({ error: "photo_invalid_format" }, { status: 400 })
    }
    const ext = photo.type === "image/png" ? ".png" : photo.type === "image/webp" ? ".webp" : ".jpg"
    photoPath = `${randomUUID()}${ext}`
    await fs.mkdir(PHOTO_DIR, { recursive: true })
    await fs.writeFile(path.join(PHOTO_DIR, photoPath), buffer)
  }

  const ownerToken = randomUUID()

  const result = db
    .prepare(
      `
        INSERT INTO entries (category, type, title, description, photo_path, lat, lng, contact, status, owner_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offen', ?)
      `
    )
    .run(
      category,
      type,
      title,
      description,
      photoPath,
      Number.isFinite(lat) ? lat : null,
      Number.isFinite(lng) ? lng : null,
      contact,
      ownerToken
    )

  const id = Number(result.lastInsertRowid)

  const response = NextResponse.json({ id, category, token: ownerToken })
  response.cookies.set(`owner_token_${id}`, ownerToken, {
    httpOnly: false,
    sameSite: "strict",
    maxAge: 31536000,
    path: "/",
  })

  return response
}
