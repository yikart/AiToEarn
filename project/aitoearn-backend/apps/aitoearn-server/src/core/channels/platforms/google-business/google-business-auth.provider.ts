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
import { GoogleBusinessConfig } from './google-business.config'
import { GoogleBusinessService } from './google-business.service'

@Injectable()
export class GoogleBusinessAuthProvider implements AuthProvider {
  constructor(
    private readonly googleBusinessService: GoogleBusinessService,
    private readonly config: GoogleBusinessConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.googleBusinessService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.googleBusinessService.exchangeCode(callback.code)

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

    const result = await this.googleBusinessService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? input.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.googleBusinessService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.googleBusinessService.getUserInfo(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      email: userInfo.email,
    }
  }

  async listSelectableAccounts(input: CredentialContext): Promise<PlatformSelectableAccount[]> {
    const accounts = await this.googleBusinessService.listAccounts(input.accessToken)
    const selectableAccounts: PlatformSelectableAccount[] = []

    for (const account of accounts) {
      const locations = await this.googleBusinessService.listLocations(
        input.accessToken,
        account.name,
      )

      for (const location of locations) {
        const locationResourceName = location.name.startsWith('accounts/')
          ? location.name
          : `${account.name}/${location.name}`

        selectableAccounts.push({
          platform: AccountType.GoogleBusiness,
          platformUid: locationResourceName,
          account: account.name,
          displayName: location.title,
          credential: {
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
          },
          profile: {
            accountName: account.name,
            accountType: account.type,
            locationName: location.title,
            websiteUri: location.websiteUri,
            address: location.storefrontAddress,
          },
        })
      }
    }

    return selectableAccounts
  }
}
