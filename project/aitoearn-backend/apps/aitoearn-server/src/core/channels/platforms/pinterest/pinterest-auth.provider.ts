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
import { PinterestConfig } from './pinterest.config'
import { PinterestService } from './pinterest.service'

@Injectable()
export class PinterestAuthProvider implements AuthProvider {
  private readonly logger = new Logger(PinterestAuthProvider.name)

  constructor(
    private readonly pinterestService: PinterestService,
    private readonly config: PinterestConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.pinterestService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.pinterestService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.pinterestService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    try {
      await this.pinterestService.revokeToken(input.accessToken)
    }
    catch (err) {
      this.logger.warn(err, 'Failed to revoke Pinterest token')
    }
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const user = await this.pinterestService.getUser(input.accessToken)

    return {
      platformUid: user.platformUid,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      fansCount: user.followerCount,
      followingCount: user.followingCount,
      raw: {
        username: user.username,
        followersCount: user.followerCount,
        followingCount: user.followingCount,
        monthlyViews: user.monthlyViews,
        pinCount: user.pinCount,
      },
    }
  }
}
