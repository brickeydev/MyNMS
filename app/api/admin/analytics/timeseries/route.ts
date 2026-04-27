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

// Safe lookup – never interpolate raw user input into SQL
const FORMATS: Record<string, string> = {
  day: "%Y-%m-%d %H:00",
  week: "%Y-%m-%d",
  month: "%Y-%m-%d",
  year: "%Y-%m",
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
  const interval = params.get("interval") ?? "month"

  const fmt = FORMATS[interval] ?? FORMATS.month

  const rows = db
    .prepare(
      `SELECT strftime('${fmt}', created_at) as period,
              COUNT(*) as pageviews,
              COUNT(DISTINCT ip_hash) as unique_visitors
       FROM page_views
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY period
       ORDER BY period ASC`
    )
    .all(`${from} 00:00:00`, `${to} 23:59:59`) as {
    period: string
    pageviews: number
    unique_visitors: number
  }[]

  return NextResponse.json(rows)
}
