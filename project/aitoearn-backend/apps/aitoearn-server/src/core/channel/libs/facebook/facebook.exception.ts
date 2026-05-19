import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

/**
 * Facebook API raw error format.
 */
export interface FacebookRawError {
  message: string
  type?: string
  code?: number
  fbtrace_id?: string
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
}

/**
 * Facebook error class.
 */
export class FacebookError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'facebook'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as { error?: FacebookRawError }

    return {
      platformCode: errResponse.error?.code,
      platformMessage: errResponse.error?.error_user_title || errResponse.error?.message,
    }
  }
}
