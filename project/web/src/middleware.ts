import type { NextRequest } from 'next/server'
import acceptLanguage from 'accept-language'
import { NextResponse } from 'next/server'
import { cookieName, fallbackLng, languages } from '@/app/i18n/settings'
import { ProxyUrls } from '@/constant'

acceptLanguage.languages(languages)

export const config = {
  // matcher: '/:lng*'
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)',
  ],
}

export function middleware(req: NextRequest) {
  if (ProxyUrls.find(v => req.nextUrl.pathname.includes(v!))) {
    return NextResponse.next()
  }
  if (
    [
      '/robots.txt',
      '/sitemap.xml',
      '/sitemap-0.xml',
      '/sitemap-1.xml',
      '/sitemap-2.xml',
      '/sitemap-3.xml',
      '/sitemap-4.xml',
      '/sitemap',
      '/healthz',
      "/js/xhs_sign_init.js",
      "/js/xhs_web_sign.js",
      "/js/xhs_sign_core.js",
      "/js/xhs_sign_inject.js",
    ].find(v => req.nextUrl.pathname.includes(v!))
  ) {
    return NextResponse.next()
  }

  if (
    req.nextUrl.pathname.includes('icon')
    || req.nextUrl.pathname.includes('chrome')
  ) {
    return NextResponse.next()
  }
  let lng: string | undefined | null
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value)
  if (!lng)
    lng = acceptLanguage.get(req.headers.get('Accept-Language'))
  if (!lng)
    lng = fallbackLng

  // Redirect if lng in path is not supported
  if (
    !languages.some(loc => req.nextUrl.pathname.startsWith(`/${loc}`))
    && !req.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(
      new URL(`/${lng}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url),
    )
  }

  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer') || '')
    const lngInReferer = languages.find(l =>
      refererUrl.pathname.startsWith(`/${l}`),
    )
    const response = NextResponse.next()
    if (lngInReferer)
      response.cookies.set(cookieName, lngInReferer)
    return response
  }
  return NextResponse.next()
}
