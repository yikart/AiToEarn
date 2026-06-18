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
} from '../../platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { parseOAuthCallback } from '../../../utils/auth-callback-state.util'
import { WechatOfficialConfig } from '../wechat.config'
import { WeChatService } from '../wechat.service'

/**
 * Auth provider for WeChat Official Accounts (微信公众号).
 *
 * Supports:
 * - OAuth2 web authorization flow
 * - Token refresh via refresh_token
 * - User profile retrieval
 * - Account listing for linked subscription accounts
 */
@Injectable()
export class WeChatOfficialAuthProvider implements AuthProvider {
  private readonly logger = new Logger(WeChatOfficialAuthProvider.name)

  readonly platform = AccountType.WeChatOfficial

  constructor(
    private readonly wechatService: WeChatService,
    private readonly config: WechatOfficialConfig,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    const scope = this.config.scopes[0] ?? ''
    const url = this.wechatService.generateOfficialAuthUrl(
      this.config.redirectUri,
      input.state,
      scope,
    )

    return { url, state: input.state, redirectUri: this.config.redirectUri }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const callback = parseOAuthCallback(input)
    const result = await this.wechatService.exchangeOfficialCode(callback.code)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: new Date(Date.now() + result.expiresIn * 1000),
      scope: result.scope,
      platformUid: result.openId,
      raw: {
        openId: result.openId,
        unionId: result.unionId,
      },
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.wechatService.refreshOfficialToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: new Date(Date.now() + result.expiresIn * 1000),
      scope: result.scope,
    }
  }

  async revoke(_input: RevokeCredentialInput): Promise<void> {
    // WeChat Official Account OAuth does not support server-side token revocation.
    // Tokens expire naturally (2 hours for access, 30 days for refresh).
    this.logger.log('WeChat Official Account tokens expire naturally; no revocation needed')
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    const openId = input.platformUid
    if (!openId) {
      throw new AppException(ResponseCode.ChannelAuthPlatformUidMissing)
    }

    const userInfo = await this.wechatService.getOfficialUserInfo(
      input.accessToken,
      openId,
    )

    return {
      platformUid: userInfo.openId,
      displayName: userInfo.nickname,
      avatarUrl: userInfo.avatarUrl,
      raw: {
        unionId: userInfo.unionId,
      },
    }
  }
}
