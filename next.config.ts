import withPWA from "@ducanh2912/next-pwa"
import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const withPWAWrapper = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/de",
        permanent: false,
      },
    ]
  },
}

export default withNextIntl(withPWAWrapper(nextConfig))
