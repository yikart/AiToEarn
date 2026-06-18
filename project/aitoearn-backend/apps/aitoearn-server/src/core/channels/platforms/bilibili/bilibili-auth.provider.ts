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
import { BilibiliConfig } from './bilibili.config'
import { BilibiliService } from './bilibili.service'

@Injectable()
export class BilibiliAuthProvider implements AuthProvider {
  private readonly logger = new Logger(BilibiliAuthProvider.name)

  constructor(
    private readonly bilibiliService: BilibiliService,
    private readonly config: BilibiliConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.bilibiliService.generateAuthUrl(input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.bilibiliService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.bilibiliService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.bilibiliService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.bilibiliService.getUserInfo(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      fansCount: userInfo.fansCount,
      followingCount: userInfo.followingCount,
      raw: {
        mid: userInfo.platformUid,
        fansCount: userInfo.fansCount,
        followingCount: userInfo.followingCount,
        archiveCount: userInfo.archiveCount,
      },
    }
  }
}
