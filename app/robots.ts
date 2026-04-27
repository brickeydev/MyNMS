import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/de/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://mynms.de/sitemap.xml",
  }
}
