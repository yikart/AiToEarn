import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface PinterestRawError {
  message?: string
  code?: number | string
}

/**
 * Pinterest error class.
 */
export class PinterestError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'pinterest'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as PinterestRawError

    return {
      platformCode: errResponse.code,
      platformMessage: errResponse.message,
    }
  }
}
