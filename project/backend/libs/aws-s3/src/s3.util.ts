import { z } from 'zod'

export function buildUrl(endpoint: string, objectPath: string) {
  const normalizedPath = String(objectPath ?? '').trim()

  if (normalizedPath && (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://'))) {
    return normalizedPath
  }

  const trimmedEndpoint = endpoint.trim().replace(/\/+$/g, '')

  const pathWithoutLeadingSlash = normalizedPath.replace(/^\/+/, '')

  const encodedPath = pathWithoutLeadingSlash
    ? pathWithoutLeadingSlash
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/')
    : ''

  return encodedPath ? `${trimmedEndpoint}/${encodedPath}` : trimmedEndpoint
}

export function zodBuildUrl(endpoint: string) {
  const validatedEndpoint = z.httpUrl().parse(endpoint)
  return z
    .string()
    .optional()
    .transform((objectPath) => {
      if (!objectPath) {
        return objectPath
      }
      return buildUrl(validatedEndpoint, objectPath)
    })
}

// 去除前置host地址的zod
export function zodTrimHost(endpoint: string) {
  const validatedEndpoint = z.httpUrl().parse(endpoint)
  return z
    .string()
    .transform((url) => {
      if (!url) {
        return url
      }
      return url.replace(validatedEndpoint, '').replace(/^\/+/, '')
    })
}
