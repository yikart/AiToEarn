import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface KwaiRawError {
  result?: number
  error_msg?: string
}

/**
 * Kwai error class.
 */
export class KwaiError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'kwai'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as KwaiRawError

    return {
      platformCode: errResponse.result,
      platformMessage: errResponse.error_msg,
    }
  }
}
