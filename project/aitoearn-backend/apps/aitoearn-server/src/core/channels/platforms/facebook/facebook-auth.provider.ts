import type {
  AuthCallbackInput,
  AuthProvider,
  CredentialContext,
  CredentialResult,
  GenerateAuthUrlInput,
  GenerateAuthUrlResult,
  PlatformAccountProfile,
  PlatformSelectableAccount,
  RefreshAccountAccessInput,
  RefreshCredentialInput,
  RevokeCredentialInput,
} from '../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { FacebookConfig } from './facebook.config'
import { FacebookService } from './facebook.service'

@Injectable()
export class FacebookAuthProvider implements AuthProvider {
  private readonly logger = new Logger(FacebookAuthProvider.name)

  constructor(
    private readonly facebookService: FacebookService,
    private readonly config: FacebookConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.facebookService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.facebookService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    const result = await this.facebookService.refreshAccessToken(input.accessToken)

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.facebookService.revokeToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.facebookService.getFacebookUser(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
    }
  }

  async listSelectableAccounts(input: CredentialContext): Promise<PlatformSelectableAccount[]> {
    const pages = await this.facebookService.listPages(input.accessToken)

    const accounts: PlatformSelectableAccount[] = []

    for (const page of pages) {
      accounts.push({
        platform: AccountType.Facebook,
        platformUid: page.id,
        displayName: page.name,
        avatarUrl: page.picture?.data?.url,
        fansCount: page.followers_count ?? page.fan_count,
        credential: {
          accessToken: page.access_token,
          refreshToken: input.refreshToken,
          expiresAt: input.expiresAt,
        },
        profile: {
          tasks: page.tasks,
          category: page.category,
          categoryList: page.category_list,
          fansCount: page.followers_count ?? page.fan_count,
          fanCount: page.fan_count,
          followersCount: page.followers_count,
        },
      })
    }

    return accounts
  }

  async refreshAccountAccess(input: RefreshAccountAccessInput): Promise<PlatformSelectableAccount> {
    const pages = await this.facebookService.listPages(input.rootAccessToken)
    const page = pages.find(p => p.id === input.platformUid)

    if (!page) {
      throw new AppException(ResponseCode.ChannelAuthAccountAccessRevoked)
    }

    return {
      platform: AccountType.Facebook,
      platformUid: page.id,
      displayName: page.name,
      avatarUrl: page.picture?.data?.url,
      fansCount: page.followers_count ?? page.fan_count,
      credential: {
        accessToken: page.access_token,
        refreshToken: input.rootRefreshToken,
      },
      profile: {
        tasks: page.tasks,
        category: page.category,
        categoryList: page.category_list,
        fansCount: page.followers_count ?? page.fan_count,
        fanCount: page.fan_count,
        followersCount: page.followers_count,
      },
    }
  }
}
