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
import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { parseAuthCodeVerifier, parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { TiktokConfig } from './tiktok.config'
import { TikTokService } from './tiktok.service'

function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

@Injectable()
export class TikTokAuthProvider implements AuthProvider {
  private readonly logger = new Logger(TikTokAuthProvider.name)

  constructor(
    private readonly tikTokService: TikTokService,
    private readonly config: TiktokConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    const url = this.tikTokService.generateAuthUrl(this.config.scopes, input.state, codeChallenge)

    return {
      url,
      state: input.state,
      redirectUri: this.config.redirectUri,
      extras: { codeVerifier },
    }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const codeVerifier = parseAuthCodeVerifier(input)
    const result = await this.tikTokService.exchangeCode(
      callback.code,
      codeVerifier,
    )

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
      tokenType: 'Bearer',
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.tikTokService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
      tokenType: 'Bearer',
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.tikTokService.revokeAccessToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.tikTokService.getUserInfo(input.accessToken)

    return {
      platformUid: userInfo.openId,
      account: userInfo.username,
      displayName: userInfo.displayName ?? userInfo.username ?? '',
      avatarUrl: userInfo.avatarUrl,
      fansCount: userInfo.followerCount,
      followingCount: userInfo.followingCount,
      raw: {
        openId: userInfo.openId,
        unionId: userInfo.unionId,
        username: userInfo.username,
        bioDescription: userInfo.bioDescription,
        followersCount: userInfo.followerCount,
        followingCount: userInfo.followingCount,
        likesCount: userInfo.likesCount,
        videoCount: userInfo.videoCount,
      },
    }
  }
}
