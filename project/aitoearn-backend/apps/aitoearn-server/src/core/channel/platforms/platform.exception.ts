import { ResponseCode } from '@yikart/common'
import { SocialMediaError, SocialMediaErrorKind } from '../libs/exception'

export class PlatformAuthExpiredException extends SocialMediaError {
  constructor(platform: string, accountId?: string, message?: string) {
    const finalMessage = message || 'OAuth2 credential expired, please re-authorize'

    super({
      platform,
      operation: 'GetAccessToken',
      kind: SocialMediaErrorKind.Auth,
      context: { accountId },
      code: ResponseCode.ChannelAuthorizationExpired,
      message: finalMessage,
      cause: {
        type: 'http',
        httpStatus: 401,
        platformMessage: finalMessage,
      },
    })
  }
}
