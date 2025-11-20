import { SocialMediaError } from '../../libs/exception'

export class PlatformAuthExpiredException extends SocialMediaError {
  constructor(platform: string, accountId?: string, message?: string) {
    super(platform, 'GetAccessToken', 'AuthError', message || 'OAuth2 credential expired, please re-authorize', 401, 401, undefined, false, { accountId })
  }
}
