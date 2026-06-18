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
import { YoutubeConfig } from './youtube.config'
import { YoutubeService } from './youtube.service'

@Injectable()
export class YoutubeAuthProvider implements AuthProvider {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly config: YoutubeConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const url = this.youtubeService.generateAuthUrl(this.config.scopes, input.state)

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.youtubeService.exchangeCode(callback.code)

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

    const result = await this.youtubeService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? input.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    await this.youtubeService.revokeAccessToken(input.accessToken)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const userInfo = await this.youtubeService.getUserInfo(input.accessToken)

    return {
      platformUid: userInfo.platformUid,
      displayName: userInfo.displayName,
      avatarUrl: userInfo.avatarUrl,
      email: userInfo.email,
    }
  }

  async listSelectableAccounts(input: CredentialContext): Promise<PlatformSelectableAccount[]> {
    const channels = await this.youtubeService.listChannelInfo(input.accessToken)
    const userInfo = await this.youtubeService.getUserInfo(input.accessToken)

    return channels.map(channelInfo => ({
      platform: AccountType.YouTube,
      platformUid: userInfo.platformUid,
      account: channelInfo.channelId,
      displayName: channelInfo.title,
      avatarUrl: channelInfo.thumbnailUrl,
      fansCount: channelInfo.subscriberCount,
      credential: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
        scope: input.scope,
      },
      profile: {
        title: channelInfo.title,
        description: channelInfo.description,
        fansCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
      },
    }))
  }
}
