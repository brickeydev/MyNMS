import fs from "node:fs/promises"
import path from "node:path"

import Parser from "rss-parser"

import { db, NEWS_IMAGE_DIR } from "@/lib/db"
import type { NewsRecord, NewsSource } from "@/lib/types"

const ONE_HOUR = 60 * 60 * 1000

const FEEDS: Record<NewsSource, string> = {
  NDR: "https://www.ndr.de/nachrichten/schleswig-holstein/Neumuenster-Aktuelle-Nachrichten-und-Videos,neumuenster770~rss2.html",
  KN: "https://www.kn-online.de/arc/outboundfeeds/rss/category/lokales/neumuenster/",
  SHZ: "https://www.shz.de/lokales/neumuenster/rss",
  POLIZEI: "https://www.presseportal.de/rss/dienststelle_47769.rss2",
  FEUERWEHR: "https://www.presseportal.de/rss/dienststelle_178961.rss2",
  STADT: "https://www.neumuenster.de/aktuelle-meldungen/rss",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser = new Parser<any, any>({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }] as [string, string, { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
})

function stripHtml(value: string | undefined) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extFromContentType(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg"
  if (contentType.includes("png")) return ".png"
  if (contentType.includes("webp")) return ".webp"
  if (contentType.includes("gif")) return ".gif"
  return ".jpg"
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  // 1. <enclosure url="..." type="image/...">
  const enc = item.enclosure as { url?: string; type?: string } | undefined
  if (enc?.url && enc.type?.startsWith("image/")) {
    return enc.url
  }

  // 2. <media:content url="...">
  const mediaContent = item.mediaContent as Array<{ $?: { url?: string } }> | undefined
  if (Array.isArray(mediaContent) && mediaContent.length > 0) {
    const url = mediaContent[0]?.$?.url
    if (url) return url
  }

  // 3. <media:thumbnail url="...">
  const mediaThumbnail = item.mediaThumbnail as { $?: { url?: string } } | undefined
  if (mediaThumbnail?.$?.url) {
    return mediaThumbnail.$.url
  }

  // 4. First <img src="..."> in raw description HTML
  const rawContent =
    (item.contentEncoded as string | undefined) ??
    (item.content as string | undefined) ??
    (item.summary as string | undefined) ??
    ""
  const imgMatch = rawContent.match(/<img\s[^>]*src=["']([^"']+)["'][^>]*>/i)
  if (imgMatch?.[1]) return imgMatch[1]

  return null
}

async function downloadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MyNMS/1.0 (+https://mynms.de)" },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) return null

    const contentType = response.headers.get("Content-Type") ?? ""
    if (!contentType.startsWith("image/")) return null

    const ext = extFromContentType(contentType)
    const filename = `${crypto.randomUUID()}${ext}`
    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(path.join(NEWS_IMAGE_DIR, filename), buffer)
    return filename
  } catch {
    return null
  }
}

async function parseFeed(source: NewsSource) {
  const response = await fetch(FEEDS[source], {
    headers: {
      "User-Agent": "MyNMS/1.0 (+https://mynms.de)",
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`feed_request_failed:${source}`)
  }

  const xml = await response.text()
  const feed = await parser.parseString(xml)

  return (feed.items ?? []).slice(0, 16).map((item: Record<string, unknown>) => {
    const pubDate =
      (item.isoDate as string | undefined) ??
      (item.pubDate as string | undefined) ??
      new Date().toISOString()

    return {
      fetched_at: new Date().toISOString(),
      guid:
        (item.guid as string | undefined) ??
        (item.id as string | undefined) ??
        (item.link as string | undefined) ??
        `${source}:${(item.title as string | undefined) ?? "untitled"}:${pubDate}`,
      title: (item.title as string | undefined) ?? "",
      link: (item.link as string | undefined) ?? FEEDS[source],
      description: stripHtml(
        (item.contentEncoded as string | undefined) ??
          (item.contentSnippet as string | undefined) ??
          (item.content as string | undefined) ??
          (item.summary as string | undefined)
      ),
      author: (item.creator as string | undefined) ?? (item.author as string | undefined) ?? null,
      pub_date: new Date(pubDate).toISOString(),
      source,
      imageUrl: extractImageUrl(item),
    }
  })
}

export async function refreshNewsCache(force = false) {
  const row = db
    .prepare("SELECT MAX(fetched_at) as fetched_at FROM news_cache")
    .get() as { fetched_at?: string | null }

  const isStale =
    !row?.fetched_at ||
    Date.now() - new Date(row.fetched_at).getTime() > ONE_HOUR

  if (!force && !isStale) {
    return
  }

  const results = await Promise.allSettled(
    Object.keys(FEEDS).map((source) => parseFeed(source as NewsSource))
  )

  const items = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )

  if (items.length === 0) {
    return
  }

  // Only download images for guids not yet in the cache
  const existingGuids = new Set(
    (db.prepare("SELECT guid FROM news_cache").all() as { guid: string }[]).map(
      (r) => r.guid
    )
  )

  const itemsWithImages = await Promise.allSettled(
    items.map(async (item) => {
      if (!item.imageUrl || existingGuids.has(item.guid)) {
        return { ...item, image_path: null as string | null }
      }
      const image_path = await downloadImage(item.imageUrl)
      return { ...item, image_path }
    })
  )

  const finalItems = itemsWithImages.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : []
  )

  const insert = db.prepare(`
    INSERT INTO news_cache (fetched_at, guid, title, link, description, author, pub_date, source, image_path)
    VALUES (@fetched_at, @guid, @title, @link, @description, @author, @pub_date, @source, @image_path)
    ON CONFLICT(guid) DO UPDATE SET
      fetched_at = excluded.fetched_at,
      title = excluded.title,
      link = excluded.link,
      description = excluded.description,
      author = excluded.author,
      pub_date = excluded.pub_date,
      source = excluded.source,
      image_path = COALESCE(news_cache.image_path, excluded.image_path)
  `)

  const prune = db.prepare(`
    DELETE FROM news_cache
    WHERE id NOT IN (
      SELECT id FROM news_cache ORDER BY datetime(pub_date) DESC LIMIT 200
    )
  `)

  const transaction = db.transaction((rows: typeof finalItems) => {
    rows.forEach((item) => insert.run(item))
    prune.run()
  })

  transaction(finalItems)
}

export async function getNewsItems(options?: {
  source?: NewsSource
  limit?: number
}): Promise<NewsRecord[]> {
  await refreshNewsCache()

  const limit = options?.limit ?? 24

  if (options?.source) {
    return db
      .prepare(
        `
          SELECT *
          FROM news_cache
          WHERE source = ?
          ORDER BY datetime(pub_date) DESC
          LIMIT ?
        `
      )
      .all(options.source, limit) as NewsRecord[]
  }

  return db
    .prepare(
      `
        SELECT *
        FROM news_cache
        ORDER BY datetime(pub_date) DESC
        LIMIT ?
      `
    )
    .all(limit) as NewsRecord[]
}
