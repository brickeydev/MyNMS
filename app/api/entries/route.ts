import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { db, PHOTO_DIR } from "@/lib/db"
import type { EntryCategory, EntryType } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-")
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

export async function POST(request: Request) {
  const formData = await request.formData()
  const category = formData.get("category") as EntryCategory | null
  const type = formData.get("type") as EntryType | null
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const contact = String(formData.get("contact") ?? "").trim() || null
  const lat = Number(formData.get("lat"))
  const lng = Number(formData.get("lng"))
  const photo = formData.get("photo")

  if (!category || !type || !title || !description) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 }
    )
  }

  let photoPath: string | null = null

  if (photo instanceof File && photo.size > 0) {
    const extension = path.extname(photo.name) || ".jpg"
    photoPath = `${randomUUID()}-${sanitizeFileName(`photo${extension}`)}`
    const buffer = Buffer.from(await photo.arrayBuffer())
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
