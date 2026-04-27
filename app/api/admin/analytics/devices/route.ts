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
  const fromTs = `${from} 00:00:00`
  const toTs = `${to} 23:59:59`

  const devices = db
    .prepare(
      `SELECT COALESCE(device_type, 'Unbekannt') as name, COUNT(*) as count
       FROM page_views WHERE created_at >= ? AND created_at <= ?
       GROUP BY device_type ORDER BY count DESC`
    )
    .all(fromTs, toTs) as { name: string; count: number }[]

  const browsers = db
    .prepare(
      `SELECT COALESCE(browser, 'Unbekannt') as name, COUNT(*) as count
       FROM page_views WHERE created_at >= ? AND created_at <= ?
       GROUP BY browser ORDER BY count DESC`
    )
    .all(fromTs, toTs) as { name: string; count: number }[]

  const os_list = db
    .prepare(
      `SELECT COALESCE(os, 'Unbekannt') as name, COUNT(*) as count
       FROM page_views WHERE created_at >= ? AND created_at <= ?
       GROUP BY os ORDER BY count DESC`
    )
    .all(fromTs, toTs) as { name: string; count: number }[]

  return NextResponse.json({ devices, browsers, os_list })
}
