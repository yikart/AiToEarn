import { customAlphabet } from 'nanoid'

/**
 * Generate a secure password using nanoid
 * Uses a custom alphabet excluding ambiguous characters (0, O, I, l)
 * Default length is 12 characters
 */
export function generateSecurePassword(length = 12): string {
  // Custom alphabet excluding ambiguous characters for better readability
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const nanoidCustom = customAlphabet(alphabet, length)
  return nanoidCustom()
}
