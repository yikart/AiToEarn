import * as crypto from 'node:crypto'

export function base64UrlEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
export function generateApiKey(prefix = 'sk', category = ''): string {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const token = base64UrlEncode(randomBytes)
  if (category) {
    return `${prefix}-${category}-${token}`
  }
  return `${prefix}-${token}`
}
