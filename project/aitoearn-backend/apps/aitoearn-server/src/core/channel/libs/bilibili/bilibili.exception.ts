import type { SocialMediaErrorCause } from '../exception'
import { SocialMediaError } from '../exception'

export interface BilibiliRawError {
  message: string
  code: number
}

/**
 * Bilibili error class.
 */
export class BilibiliError extends SocialMediaError {
  protected static override getPlatformName(): string {
    return 'bilibili'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }
    const d = data as Record<string, unknown>

    return {
      platformCode: d['code'] as number | undefined,
      platformMessage: d['message'] as string | undefined,
    }
  }
}
