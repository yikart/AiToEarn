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
import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { parseAuthCodeVerifier, parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { TwitterConfig } from './twitter.config'
import { TwitterService } from './twitter.service'

@Injectable()
export class TwitterAuthProvider implements AuthProvider {
  private readonly logger = new Logger(TwitterAuthProvider.name)

  constructor(
    private readonly twitterService: TwitterService,
    private readonly config: TwitterConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    // Generate PKCE code verifier
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)

    const result = await this.twitterService.generateAuthUrl(
      this.config.scopes,
      input.state,
      codeVerifier,
      codeChallenge,
    )

    return {
      url: result.url,
      state: input.state,
      redirectUri: this.config.redirectUri,
      extras: {
        codeVerifier: result.codeVerifier,
      },
    }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const codeVerifier = parseAuthCodeVerifier(input)
    const result = await this.twitterService.exchangeCode(callback.code, codeVerifier)

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

    const result = await this.twitterService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.twitterService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.twitterService.getUserInfo(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      account: userInfo.username,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      fansCount: userInfo.followersCount,
      followingCount: userInfo.followingCount,
      raw: {
        username: userInfo.username,
        followersCount: userInfo.followersCount,
        followingCount: userInfo.followingCount,
        tweetCount: userInfo.tweetCount,
      },
    }
  }

  private generateCodeVerifier(): string {
    return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hash).toString('base64url')
  }
}
