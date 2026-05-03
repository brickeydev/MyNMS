import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { SESSION_COOKIE, verifyAdminJWT } from "@/lib/auth"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin(): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifyAdminJWT(token)
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const status = searchParams.get("status")
  const type = searchParams.get("type")

  const conditions: string[] = []
  const values: string[] = []

  if (category) {
    conditions.push("category = ?")
    values.push(category)
  }
  if (status) {
    conditions.push("status = ?")
    values.push(status)
  }
  if (type) {
    conditions.push("type = ?")
    values.push(type)
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : ""

  const entries = db
    .prepare(
      `SELECT id, created_at, category, type, title, description,
              photo_path, lat, lng, contact, status
       FROM entries ${where}
       ORDER BY datetime(created_at) DESC`
    )
    .all(...values)

  return NextResponse.json(entries)
}
