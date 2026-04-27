import { type NextRequest, NextResponse } from "next/server"
import { UAParser } from "ua-parser-js"

import { db, getDailySalt } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function POST(req: NextRequest) {
  if (process.env.ANALYTICS_ENABLED === "false") {
    return NextResponse.json({ ok: true })
  }

  try {
    const body = (await req.json()) as {
      path?: string
      referrer?: string
      ip?: string
      userAgent?: string
    }

    const { path, referrer, ip = "0.0.0.0", userAgent = "" } = body
    if (!path) return NextResponse.json({ ok: true })

    const salt = getDailySalt()
    const ipHash = await sha256(ip + salt)
    const sessionHash = await sha256(ip + userAgent + salt)

    const parser = new UAParser(userAgent)
    const device = parser.getDevice()
    const browser = parser.getBrowser()
    const os = parser.getOS()

    let deviceType = "Desktop"
    if (device.type === "mobile") deviceType = "Mobile"
    else if (device.type === "tablet") deviceType = "Tablet"

    db.prepare(
      `INSERT INTO page_views
         (path, referrer, ip_hash, user_agent, device_type, browser, os, session_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      path,
      referrer || null,
      ipHash,
      userAgent || null,
      deviceType,
      browser.name || null,
      os.name || null,
      sessionHash
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
