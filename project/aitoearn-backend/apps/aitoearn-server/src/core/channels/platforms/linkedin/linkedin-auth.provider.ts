import type {
  AuthCallbackInput,
  AuthProvider,
  CredentialContext,
  CredentialResult,
  GenerateAuthUrlInput,
  GenerateAuthUrlResult,
  PlatformAccountProfile,
  PlatformSelectableAccount,
  RefreshCredentialInput,
  RevokeCredentialInput,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { LinkedinConfig } from './linkedin.config'
import { LinkedInService } from './linkedin.service'

@Injectable()
export class LinkedInAuthProvider implements AuthProvider {
  constructor(
    private readonly linkedinService: LinkedInService,
    private readonly config: LinkedinConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.linkedinService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.linkedinService.exchangeCode(callback.code)

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

    const result = await this.linkedinService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.linkedinService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const profile = await this.linkedinService.getProfile(input.accessToken)

    return {
      platformUid: profile.platformUid,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      email: profile.email,
    }
  }

  async listSelectableAccounts(input: CredentialContext): Promise<PlatformSelectableAccount[]> {
    const profile = await this.linkedinService.getProfile(input.accessToken)

    return [
      {
        platform: AccountType.LinkedIn,
        platformUid: profile.platformUid,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        credential: {
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
        },
      },
    ]
  }
}
