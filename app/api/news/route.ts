import { NextResponse } from "next/server"

import { getNewsItems } from "@/lib/news"
import { NEWS_SOURCES, type NewsSource } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source")
  const parsedSource = NEWS_SOURCES.includes(source as NewsSource)
    ? (source as NewsSource)
    : undefined

  const items = await getNewsItems({ source: parsedSource, limit: 48 })
  return NextResponse.json(items)
}
