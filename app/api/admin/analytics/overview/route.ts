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

function dateRange(params: URLSearchParams): { from: string; to: string } {
  const from =
    params.get("from") ??
    new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  const to = params.get("to") ?? new Date().toISOString().slice(0, 10)
  return { from: `${from} 00:00:00`, to: `${to} 23:59:59` }
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { from, to } = dateRange(new URL(req.url).searchParams)

  const pageviews = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM page_views WHERE created_at >= ? AND created_at <= ?"
      )
      .get(from, to) as { c: number }
  ).c

  const uniqueVisitors = (
    db
      .prepare(
        "SELECT COUNT(DISTINCT ip_hash) as c FROM page_views WHERE created_at >= ? AND created_at <= ?"
      )
      .get(from, to) as { c: number }
  ).c

  const uniqueSessions = (
    db
      .prepare(
        "SELECT COUNT(DISTINCT session_hash) as c FROM page_views WHERE created_at >= ? AND created_at <= ?"
      )
      .get(from, to) as { c: number }
  ).c

  const topPages = db
    .prepare(
      `SELECT path, COUNT(*) as count
       FROM page_views WHERE created_at >= ? AND created_at <= ?
       GROUP BY path ORDER BY count DESC LIMIT 10`
    )
    .all(from, to) as { path: string; count: number }[]

  const topReferrers = db
    .prepare(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Direkt') as referrer, COUNT(*) as count
       FROM page_views WHERE created_at >= ? AND created_at <= ?
       GROUP BY referrer ORDER BY count DESC LIMIT 10`
    )
    .all(from, to) as { referrer: string; count: number }[]

  return NextResponse.json({
    pageviews,
    uniqueVisitors,
    uniqueSessions,
    avgPerVisitor:
      uniqueVisitors > 0
        ? Math.round((pageviews / uniqueVisitors) * 10) / 10
        : 0,
    topPages,
    topReferrers,
  })
}
