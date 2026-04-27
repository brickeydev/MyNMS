import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = new URL(req.url).searchParams
  const from =
    params.get("from") ??
    new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  const to = params.get("to") ?? new Date().toISOString().slice(0, 10)
  const limit = Math.min(parseInt(params.get("limit") ?? "10", 10), 100)

  const rows = db
    .prepare(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Direkt') as referrer,
              COUNT(*) as count
       FROM page_views
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY referrer
       ORDER BY count DESC
       LIMIT ?`
    )
    .all(`${from} 00:00:00`, `${to} 23:59:59`, limit) as {
    referrer: string
    count: number
  }[]

  return NextResponse.json(rows)
}
