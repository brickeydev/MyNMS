import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, LOGO_DIR } from "@/lib/db"
import type { DirectoryCategory } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

function validateImageMagicBytes(buf: Buffer): boolean {
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return true
  // WebP  RIFF????WEBP
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")

  const query = category
    ? db
        .prepare(
          `SELECT id, created_at, category, name, description, logo_path, address, website,
                  phone, email, social_instagram, social_facebook, social_spotify, social_tiktok,
                  social_soundcloud, social_youtube, social_linkedin, opening_hours, lat, lng, approved
           FROM directory
           WHERE approved = 1 AND category = ?
           ORDER BY name COLLATE NOCASE ASC`
        )
        .all(category)
    : db
        .prepare(
          `SELECT id, created_at, category, name, description, logo_path, address, website,
                  phone, email, social_instagram, social_facebook, social_spotify, social_tiktok,
                  social_soundcloud, social_youtube, social_linkedin, opening_hours, lat, lng, approved
           FROM directory
           WHERE approved = 1
           ORDER BY name COLLATE NOCASE ASC`
        )
        .all()

  return NextResponse.json(query)
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  let fields: Record<string, string> = {}
  let logoPath: string | null = null

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    for (const [key, val] of formData.entries()) {
      if (typeof val === "string") fields[key] = val
    }

    const logoFile = formData.get("logo") as File | null
    if (logoFile instanceof File && logoFile.size > 0) {
      if (logoFile.size > MAX_LOGO_SIZE) {
        return NextResponse.json(
          { error: "logo_too_large" },
          { status: 400 }
        )
      }
      if (!ALLOWED_MIME.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "logo_invalid_mime" },
          { status: 400 }
        )
      }
      const buf = Buffer.from(await logoFile.arrayBuffer())
      if (!validateImageMagicBytes(buf)) {
        return NextResponse.json(
          { error: "logo_invalid_format" },
          { status: 400 }
        )
      }
      const ext = logoFile.type === "image/png"
        ? ".png"
        : logoFile.type === "image/webp"
          ? ".webp"
          : ".jpg"
      const filename = `${randomUUID()}${ext}`
      await fs.mkdir(LOGO_DIR, { recursive: true })
      await fs.writeFile(path.join(LOGO_DIR, filename), buf)
      logoPath = filename
    }
  } else {
    fields = (await request.json()) as Record<string, string>
    logoPath = fields.logo_path || null
  }

  const category = fields.category as DirectoryCategory | undefined
  const name = (fields.name ?? "").trim()
  const description = (fields.description ?? "").trim()

  if (!category || !name || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  const ownerToken = randomUUID()
  const lat = fields.lat ? Number(fields.lat) : null
  const lng = fields.lng ? Number(fields.lng) : null

  const result = db
    .prepare(
      `INSERT INTO directory (
          category, name, description, logo_path, address, website, phone, email,
          social_instagram, social_facebook, social_spotify, social_tiktok,
          social_soundcloud, social_youtube, social_linkedin,
          opening_hours, lat, lng, approved, owner_token
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
    .run(
      category,
      name,
      description,
      logoPath,
      fields.address || null,
      fields.website || null,
      fields.phone || null,
      fields.email || null,
      fields.social_instagram || null,
      fields.social_facebook || null,
      fields.social_spotify || null,
      fields.social_tiktok || null,
      fields.social_soundcloud || null,
      fields.social_youtube || null,
      fields.social_linkedin || null,
      fields.opening_hours || null,
      lat !== null && Number.isFinite(lat) ? lat : null,
      lng !== null && Number.isFinite(lng) ? lng : null,
      ownerToken
    )

  const id = Number(result.lastInsertRowid)

  const response = NextResponse.json({ id, token: ownerToken }, { status: 201 })
  response.cookies.set(`owner_token_${id}`, ownerToken, {
    httpOnly: false,
    sameSite: "strict",
    maxAge: 31536000,
    path: "/",
  })

  return response
}
