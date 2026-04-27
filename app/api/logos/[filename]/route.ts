import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { LOGO_DIR } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 })
  }

  const filePath = path.join(LOGO_DIR, filename)

  try {
    const buf = await fs.readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    const mime = MIME[ext] ?? "application/octet-stream"
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
}
