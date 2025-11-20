import { SocialMediaError } from '../../libs/exception'

export class PlatformAuthExpiredException extends SocialMediaError {
  constructor(platform: string) {
    super(platform, 'GetAccessToken', 'AuthError', 'OAuth2 credential expired, please re-authorize', 401, 401, undefined, false, undefined)
  }
}
