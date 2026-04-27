import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

import { signAdminJWT, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"
import { checkRateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too_many_attempts" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 900) },
      }
    )
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const { username, password } = body

  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin"
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ""

  if (!username || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 })
  }

  const usernameMatch = username === expectedUsername
  const passwordMatch = expectedPassword.startsWith("$2")
    ? await bcrypt.compare(password, expectedPassword)
    : password === expectedPassword

  if (!usernameMatch || !passwordMatch) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
  }

  const token = await signAdminJWT()
  const response = NextResponse.json({ ok: true })
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.headers.get("x-forwarded-ssl")

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
    secure: proto === "https" || proto === "on",
  })

  return response
}
