import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface InstagramRawError {
  message: string
  type: string
  code: number
  error_subcode?: number
  fbtrace_id?: string
  error_user_msg?: string
  error_user_title?: string
}

/**
 * Instagram error class.
 */
export class InstagramError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'instagram'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as { error?: InstagramRawError }

    return {
      platformCode: errResponse.error?.code,
      platformMessage: errResponse.error?.error_user_title || errResponse.error?.message,
    }
  }
}
