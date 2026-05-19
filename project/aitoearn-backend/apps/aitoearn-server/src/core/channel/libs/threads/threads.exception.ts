import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface ThreadsRawError {
  message: string
  type: string
  code: number
  fbtrace_id?: string
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
}

/**
 * Threads error class.
 */
export class ThreadsError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'threads'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as { error?: ThreadsRawError }

    return {
      platformCode: errResponse.error?.code,
      platformMessage: errResponse.error?.error_user_title || errResponse.error?.message,
    }
  }
}
