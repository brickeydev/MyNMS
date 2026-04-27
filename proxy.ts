import createMiddleware from "next-intl/middleware"
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

import { routing } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

function jwtSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-change-in-production"
  )
}

function trackPageView(request: NextRequest, event: NextFetchEvent) {
  if (process.env.ANALYTICS_ENABLED === "false") return

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0"

  const promise = fetch(
    new URL("/api/analytics/track", request.url).toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: request.nextUrl.pathname,
        referrer: request.headers.get("referer") ?? "",
        ip,
        userAgent: request.headers.get("user-agent") ?? "",
      }),
    }
  ).catch(() => {})

  if (typeof event.waitUntil === "function") {
    event.waitUntil(promise)
  }
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }

    const token = request.cookies.get("admin_session")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    try {
      await jwtVerify(token, jwtSecret())
      return NextResponse.next()
    } catch {
      const res = NextResponse.redirect(
        new URL("/admin/login", request.url)
      )
      res.cookies.delete("admin_session")
      return res
    }
  }

  // Track public page views (non-admin, non-API paths are already excluded by matcher)
  trackPageView(request, event)

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
