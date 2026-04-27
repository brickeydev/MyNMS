import { getRequestConfig } from "next-intl/server"

import { routing } from "@/i18n/routing"

export default getRequestConfig(async ({ requestLocale }) => {
  const candidate = await requestLocale
  const locale = routing.locales.includes(
    candidate as (typeof routing.locales)[number]
  )
    ? (candidate as (typeof routing.locales)[number])
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
