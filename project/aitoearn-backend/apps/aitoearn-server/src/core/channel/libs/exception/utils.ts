/**
 * Auto-generates operation name from HTTP method and URL.
 *
 * Examples:
 * - method: 'POST', url: 'https://graph.facebook.com/v23.0/me/feed' -> 'POST /v23.0/me/feed'
 * - method: 'GET', url: 'https://graph.facebook.com/v23.0/me' -> 'GET /v23.0/me'
 *
 * @param method - HTTP method (e.g., 'GET', 'POST').
 * @param url - Request URL.
 * @returns Generated operation name.
 */
export function generateOperation(method?: string, url?: string): string {
  if (!method || !url) {
    return 'unknown'
  }

  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    return `${method.toUpperCase()} ${path}`
  }
  catch {
    const match = url.match(/https?:\/\/[^/]+(\/[^?#]*)/)
    if (match) {
      return `${method.toUpperCase()} ${match[1]}`
    }
    return `${method.toUpperCase()} ${url}`
  }
}
