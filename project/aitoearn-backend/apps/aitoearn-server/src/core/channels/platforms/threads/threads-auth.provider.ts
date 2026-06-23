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
import { parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { ThreadsConfig } from './threads.config'
import { ThreadsService } from './threads.service'

@Injectable()
export class ThreadsAuthProvider implements AuthProvider {
  private readonly logger = new Logger(ThreadsAuthProvider.name)

  constructor(
    private readonly threadsService: ThreadsService,
    private readonly config: ThreadsConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.threadsService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    // Exchange code for short-lived token
    const shortLivedResult = await this.threadsService.exchangeCode(callback.code)

    // Exchange short-lived token for long-lived token
    const longLivedResult = await this.threadsService.exchangeForLongLivedToken(
      shortLivedResult.accessToken,
    )

    return {
      accessToken: longLivedResult.accessToken,
      expiresAt: longLivedResult.expiresAt,
      scope: shortLivedResult.scope,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    const result = await this.threadsService.refreshAccessToken(input.accessToken)

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    }
  }

  async revoke(_input: RevokeCredentialInput): Promise<void> {
    // Threads API does not support token revocation directly
    // Tokens will expire naturally (long-lived tokens last ~60 days)
    this.logger.log('Threads does not support token revocation; tokens expire naturally')
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const profile = await this.threadsService.getUserProfile(input.accessToken)
    let followersCount: number | undefined
    try {
      followersCount = await this.threadsService.getFollowerCount(profile.platformUid, input.accessToken)
    }
    catch (err) {
      this.logger.warn(err, 'Failed to fetch Threads follower count')
    }

    return {
      platformUid: profile.platformUid,
      account: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      fansCount: followersCount,
      raw: {
        username: profile.username,
        biography: profile.biography,
        followersCount,
      },
    }
  }
}
