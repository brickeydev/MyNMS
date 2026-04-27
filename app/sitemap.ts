import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://mynms.de/de",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://mynms.de/de/nachrichten",
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://mynms.de/de/eintraege/tiere",
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://mynms.de/de/eintraege/gegenstaende",
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://mynms.de/de/vorgestellt",
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: "https://mynms.de/de/neu",
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]
}
