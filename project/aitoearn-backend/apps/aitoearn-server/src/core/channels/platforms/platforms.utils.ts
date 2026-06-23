export type PlatformGraphQueryValue = string | number | boolean | Date | undefined
export type PlatformGraphQuery = Record<string, PlatformGraphQueryValue>
export type PlatformGraphQueryInput = Record<string, unknown>

export function normalizePlatformGraphQuery(query: PlatformGraphQueryInput = {}): PlatformGraphQuery {
  const normalized: PlatformGraphQuery = {}
  for (const [key, value] of Object.entries(query)) {
    if (isPlatformGraphQueryValue(value)) {
      normalized[key] = value
    }
  }
  return normalized
}

function isPlatformGraphQueryValue(value: unknown): value is PlatformGraphQueryValue {
  return value === undefined
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || value instanceof Date
}

export function parsePlatformDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function getUrlPathExtension(url: string): string {
  const path = getUrlPath(url).toLowerCase()
  const lastDotIndex = path.lastIndexOf('.')
  if (lastDotIndex < 0) {
    return ''
  }
  return path.slice(lastDotIndex)
}

export function hasUrlPathExtension(url: string, extensions: string[]): boolean {
  return extensions.includes(getUrlPathExtension(url))
}

function getUrlPath(url: string): string {
  try {
    return new URL(url).pathname
  }
  catch {
    return url.split('?')[0]?.split('#')[0] ?? url
  }
}
