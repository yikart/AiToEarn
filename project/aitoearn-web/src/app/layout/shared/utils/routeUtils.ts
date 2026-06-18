/**
 * route - route helper functions
 */

import { languages } from '@/app/i18n/settings'

const PUBLIC_PATHS = [
  '/auth',
  '/websit',
  '/blog',
  '/chat',
  '/welcome',
]

function getPathWithoutLanguagePrefix(pathname: string) {
  let path = pathname
  for (const lang of languages) {
    if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) {
      path = pathname.slice(lang.length + 1) || '/'
      break
    }
  }

  return path
}

export function isPublicPage(pathname: string): boolean {
  const path = getPathWithoutLanguagePrefix(pathname)

  if (path === '/' || path === '') {
    return true
  }

  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))
}
