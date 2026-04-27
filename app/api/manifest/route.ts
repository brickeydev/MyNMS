import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language') || 'de'
  const locale = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
  const validLocales = ['de', 'en', 'tr']
  const lang = validLocales.includes(locale) ? locale : 'de'

  return NextResponse.json({
    name: 'MyNMS – Deine Plattform für Neumünster',
    short_name: 'MyNMS',
    description: 'Fundmeldungen, lokale Nachrichten und vorgestellte Orte aus Neumünster.',
    start_url: `/${lang}`,
    scope: '/',
    display: 'standalone',
    background_color: '#F0F7F0',
    theme_color: '#5BA55B',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache'
    }
  })
}
