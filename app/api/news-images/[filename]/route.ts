import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

import { NEWS_IMAGE_DIR } from "@/lib/db"

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
  const decoded = decodeURIComponent(filename)

  // Reject path traversal attempts
  if (decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 })
  }

  const filePath = path.join(NEWS_IMAGE_DIR, decoded)

  // Verify the resolved path stays within NEWS_IMAGE_DIR
  const resolvedDir = path.resolve(NEWS_IMAGE_DIR)
  const resolvedFile = path.resolve(filePath)
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 })
  }

  try {
    const file = await fs.readFile(resolvedFile)
    const extension = path.extname(decoded).toLowerCase()

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
}
