import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const approved = searchParams.get("approved")

  const conditions: string[] = []
  const values: (string | number)[] = []

  if (category) {
    conditions.push("category = ?")
    values.push(category)
  }
  if (approved !== null && approved !== "") {
    conditions.push("approved = ?")
    values.push(Number(approved))
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const entries = db
    .prepare(
      `SELECT id, created_at, category, name, description, logo_path, address, website,
              phone, email, social_instagram, social_facebook, opening_hours, lat, lng, approved
       FROM directory ${where}
       ORDER BY datetime(created_at) DESC`
    )
    .all(...values)

  return NextResponse.json(entries)
}
