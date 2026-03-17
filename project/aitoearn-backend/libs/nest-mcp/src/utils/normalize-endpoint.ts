/**
 * Normalizes an endpoint by removing double slashes and ensuring it does not start with a slash.
 */
export function normalizeEndpoint(endpoint?: string | null): string {
  try {
    if (!endpoint) {
      return ''
    }

    // Check if the endpoint has a protocol
    const protocolMatch = endpoint.match(/^([a-z][a-z0-9+.-]*):\/\//i)

    if (protocolMatch) {
      // Has protocol: preserve protocol slashes, collapse slashes in the path
      const protocol = protocolMatch[0] // e.g., "http://"
      const pathPart = endpoint.slice(protocol.length)
      const normalizedPath = pathPart.replace(/\/+/g, '/')
      const result = protocol + normalizedPath
      return result
    }
    else {
      // No protocol: collapse all slashes and remove leading slash
      const normalized = endpoint.replace(/\/+/g, '/')
      const result = normalized.startsWith('/')
        ? normalized.slice(1)
        : normalized
      return result
    }
  }
  catch {
    return ''
  }
}
