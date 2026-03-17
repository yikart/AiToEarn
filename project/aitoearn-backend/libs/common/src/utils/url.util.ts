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

export function zodBuildUrl(getEndpoint: () => string) {
  return z
    .string()
    .optional()
    .transform((objectPath) => {
      if (!objectPath) {
        return objectPath
      }
      const endpoint = getEndpoint()
      if (!endpoint) {
        return objectPath
      }
      return buildUrl(endpoint, objectPath)
    })
}

export function zodTrimHost(getEndpoint: () => string) {
  return z
    .string()
    .transform((url) => {
      if (!url) {
        return url
      }
      const endpoint = getEndpoint()
      if (!endpoint) {
        return url
      }
      return url.replace(endpoint, '').replace(/^\/+/, '')
    })
}
