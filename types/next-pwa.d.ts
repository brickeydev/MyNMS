declare module "@ducanh2912/next-pwa" {
  import type { NextConfig } from "next"

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    sw?: string
    scope?: string
    reloadOnOnline?: boolean
    cacheOnFrontEndNav?: boolean
    fallbacks?: Record<string, string>
    buildExcludes?: Array<string | RegExp>
    publicExcludes?: string[]
    [key: string]: unknown
  }

  type WithPWA = (config: PWAConfig) => (nextConfig: NextConfig) => NextConfig

  const withPWA: WithPWA
  export default withPWA
}
