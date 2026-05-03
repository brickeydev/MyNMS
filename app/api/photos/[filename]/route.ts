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

  if (resolvedFile.includes("..") || resolvedFile.includes("/") || resolvedFile.includes("\\")) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 })
  }

  const filePath = path.join(PHOTO_DIR, resolvedFile)
  const resolvedDir = path.resolve(PHOTO_DIR)
  const resolvedPath = path.resolve(filePath)
  if (!resolvedPath.startsWith(resolvedDir + path.sep) && resolvedPath !== resolvedDir) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 })
  }

  try {
    const file = await fs.readFile(resolvedPath)
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
