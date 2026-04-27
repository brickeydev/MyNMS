import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://mynms.de"),
  title: {
    default: "MyNMS – Deine Plattform für Neumünster",
    template: "%s | MyNMS",
  },
  description:
    "MyNMS verbindet Fundmeldungen, lokale Nachrichten und vorgestellte Orte aus Neumünster in einer klaren, mobilen Oberfläche.",
  keywords: [
    "Neumünster",
    "Fundtiere",
    "Fundsachen",
    "Nachrichten",
    "Community",
    "Lokalplattform",
  ],
  authors: [{ name: "MyNMS" }],
  creator: "MyNMS",
  publisher: "MyNMS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://mynms.de",
    siteName: "MyNMS",
    title: "MyNMS – Deine Plattform für Neumünster",
    description:
      "Fundmeldungen, lokale Nachrichten und vorgestellte Orte aus Neumünster.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyNMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyNMS – Deine Plattform für Neumünster",
    description:
      "Fundmeldungen, lokale Nachrichten und vorgestellte Orte aus Neumünster.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={cn(
        "bg-background antialiased",
        fontMono.variable,
        geist.variable
      )}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#5BA55B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyNMS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MyNMS",
              url: "https://mynms.de",
              description: "Community-Plattform für Neumünster",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://mynms.de/de/eintraege/tiere",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
