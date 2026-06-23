import type {
  AuthCallbackInput,
  AuthProvider,
  CredentialContext,
  CredentialResult,
  GenerateAuthUrlInput,
  GenerateAuthUrlResult,
  PlatformAccountProfile,
  RefreshCredentialInput,
  RevokeCredentialInput,
} from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { KwaiConfig } from './kwai.config'
import { KwaiService } from './kwai.service'

@Injectable()
export class KwaiAuthProvider implements AuthProvider {
  private readonly logger = new Logger(KwaiAuthProvider.name)

  constructor(
    private readonly kwaiService: KwaiService,
    private readonly config: KwaiConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.kwaiService.generateAuthUrl(this.config.scopes, input.state, input.deviceType)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.kwaiService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
      platformUid: result.openId,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.kwaiService.refreshToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(_input: RevokeCredentialInput): Promise<void> {
    // Kwai does not support token revocation via API
    this.logger.warn('Kwai does not support token revocation via API')
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const platformUid = this.getPlatformUid(input)
    const userInfo = await this.kwaiService.getUserInfo(input.accessToken)

    return {
      platformUid,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      fansCount: userInfo.fanCount,
      followingCount: userInfo.followCount,
      raw: {
        fanCount: userInfo.fanCount,
        followCount: userInfo.followCount,
        city: userInfo.city,
        sex: userInfo.sex,
      },
    }
  }

  private getPlatformUid(input: CredentialContext): string {
    if (!input.platformUid) {
      throw new AppException(ResponseCode.ChannelAuthPlatformUidMissing)
    }
    return input.platformUid
  }
}
