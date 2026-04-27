import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { PHOTO_DIR } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const mimeTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const resolvedFile = decodeURIComponent(filename)
  const filePath = path.join(PHOTO_DIR, resolvedFile)

  try {
    const file = await fs.readFile(filePath)
    const extension = path.extname(resolvedFile).toLowerCase()

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
}
