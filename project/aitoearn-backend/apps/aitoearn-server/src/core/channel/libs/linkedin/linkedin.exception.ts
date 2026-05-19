import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface LinkedInRawError {
  message?: string
  serviceErrorCode?: number
  status?: number
}

/**
 * LinkedIn error class.
 */
export class LinkedInError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'linkedin'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as LinkedInRawError

    return {
      platformCode: errResponse.serviceErrorCode,
      platformMessage: errResponse.message,
    }
  }
}
