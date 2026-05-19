import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface TiktokRawError {
  code?: number | string
  message?: string
}

/**
 * Tiktok error class.
 */
export class TiktokError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'tiktok'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as { error?: TiktokRawError }

    return {
      platformCode: errResponse.error?.code,
      platformMessage: errResponse.error?.message,
    }
  }
}
