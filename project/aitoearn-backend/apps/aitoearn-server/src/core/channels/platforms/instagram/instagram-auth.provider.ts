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
import { InstagramConfig } from './instagram.config'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramAuthProvider implements AuthProvider {
  private readonly logger = new Logger(InstagramAuthProvider.name)

  constructor(
    private readonly instagramService: InstagramService,
    private readonly config: InstagramConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.instagramService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.instagramService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    const result = await this.instagramService.refreshAccessToken(input.accessToken)

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.instagramService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.instagramService.getInstagramUser(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      account: userInfo.username,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      fansCount: userInfo.followersCount,
      followingCount: userInfo.followsCount,
      raw: {
        username: userInfo.username,
        accountType: userInfo.accountType,
        followersCount: userInfo.followersCount,
        followingCount: userInfo.followsCount,
        mediaCount: userInfo.mediaCount,
      },
    }
  }
}
