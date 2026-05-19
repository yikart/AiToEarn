import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface WxGZHRawError {
  errcode?: number
  errmsg?: string
}

/**
 * WxGZH error class.
 */
export class WxGZHError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'wxgzh'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const errResponse = data as WxGZHRawError

    return {
      platformCode: errResponse.errcode,
      platformMessage: errResponse.errmsg,
    }
  }
}
