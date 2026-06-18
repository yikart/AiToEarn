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
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { z } from 'zod'
import { assertParsedCallbackState, parseOAuthCallback } from '../../utils/auth-callback-state.util'
import { AuthCallbackResponseType, AuthType } from '../platforms.interface'
import { DouyinMiniAppService } from './douyin-miniapp.service'
import { DouyinConfig } from './douyin.config'
import { DouyinService } from './douyin.service'

const DOUYIN_MINIAPP_USER_DATA_SCOPE = 'ma.user.data'
const DOUYIN_MINIAPP_VIDEO_BIND_SCOPE = 'ma.video.bind'

const DouyinMiniAppTicketsSchema = z.object({
  [DOUYIN_MINIAPP_USER_DATA_SCOPE]: z.string().min(1),
  [DOUYIN_MINIAPP_VIDEO_BIND_SCOPE]: z.string().min(1),
})

const DouyinMiniAppCallbackSchema = z.object({
  state: z.string().min(1),
  token: z.string().min(1),
  nickname: z.string().min(1).optional(),
  avatar: z.url().optional(),
  tickets: DouyinMiniAppTicketsSchema.optional(),
})

type DouyinMiniAppCallback = z.infer<typeof DouyinMiniAppCallbackSchema>

@Injectable()
export class DouyinAuthProvider implements AuthProvider {
  constructor(
    private readonly douyinService: DouyinService,
    private readonly config: DouyinConfig,
    private readonly douyinMiniAppService: DouyinMiniAppService,
  ) {}

  async generateAuthUrl(input: GenerateAuthUrlInput): Promise<GenerateAuthUrlResult> {
    if (this.config.authType === AuthType.OAuth2) {
      return {
        url: this.douyinService.generateAuthUrl(this.config.scopes, input.state),
        state: input.state,
        redirectUri: this.config.redirectUri,
      }
    }

    const qrCodePath = this.buildMiniAppChannelAuthPath(input.state)
    const qrCodeBase64 = await this.douyinMiniAppService.createQrCode({
      path: qrCodePath,
      width: 430,
      appName: 'douyin',
      isCircleCode: false,
    })

    return {
      url: this.toImageDataUrl(qrCodeBase64),
      state: input.state,
      redirectUri: this.config.redirectUri,
      extras: { qrCodePath },
    }
  }

  async exchangeCode(input: AuthCallbackInput): Promise<CredentialResult> {
    const miniAppCallback = this.parseMiniAppCallback(input)
    if (miniAppCallback) {
      return this.exchangeMiniAppCallback(input, miniAppCallback)
    }

    const callback = parseOAuthCallback(input)
    const result = await this.douyinService.exchangeCode(callback.code)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
      tokenType: 'Bearer',
      platformUid: result.openId,
      raw: {
        openId: result.openId,
        refreshExpiresAt: result.refreshExpiresAt,
      },
    }
  }

  async refresh(input: RefreshCredentialInput): Promise<CredentialResult> {
    if (!input.refreshToken) {
      throw new AppException(ResponseCode.ChannelAuthRefreshTokenMissing)
    }

    const result = await this.douyinService.refreshAccessToken(input.refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: result.scope,
      tokenType: 'Bearer',
      raw: {
        refreshExpiresAt: result.refreshExpiresAt,
      },
    }
  }

  async revoke(input: RevokeCredentialInput): Promise<void> {
    if (!input.platformUid) {
      throw new AppException(ResponseCode.ChannelAuthPlatformUidMissing)
    }

    await this.douyinService.revokeAccessToken(input.accessToken, input.platformUid)
  }

  async getProfile(input: CredentialContext): Promise<PlatformAccountProfile> {
    if (!input.platformUid) {
      throw new AppException(ResponseCode.ChannelAuthPlatformUidMissing)
    }

    const userInfo = await this.douyinService.getUserInfo(input.accessToken, input.platformUid)

    return {
      platformUid: input.platformUid,
      displayName: userInfo.nickname ?? '',
      avatarUrl: userInfo.avatar,
      raw: {
        openId: userInfo.openId,
        unionId: userInfo.unionId,
        nickname: userInfo.nickname,
        city: userInfo.city,
        province: userInfo.province,
        country: userInfo.country,
        eAccountRole: userInfo.eAccountRole,
      },
    }
  }

  private async exchangeMiniAppCallback(
    input: AuthCallbackInput,
    callback: DouyinMiniAppCallback,
  ): Promise<CredentialResult> {
    const sessionInfo = await this.douyinMiniAppService.code2Session(callback.token)
    if (!sessionInfo?.openid) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }
    const openId = sessionInfo.openid
    const unionId = sessionInfo.unionid

    if (this.config.authType !== AuthType.QrCode) {
      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }
    if (!callback.tickets) {
      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }

    const userDataTicket = callback.tickets[DOUYIN_MINIAPP_USER_DATA_SCOPE]
    const videoBindTicket = callback.tickets[DOUYIN_MINIAPP_VIDEO_BIND_SCOPE]
    const homepageCredential = await this.douyinMiniAppService.getUserAccessToken(userDataTicket)
    const videoCredential = userDataTicket === videoBindTicket
      ? homepageCredential
      : await this.douyinMiniAppService.getUserAccessToken(videoBindTicket)

    if (homepageCredential.openId !== openId || videoCredential.openId !== openId) {
      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }

    if (!this.hasMiniAppScope(homepageCredential.scope, DOUYIN_MINIAPP_USER_DATA_SCOPE)) {
      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }
    if (!this.hasMiniAppScope(videoCredential.scope, DOUYIN_MINIAPP_VIDEO_BIND_SCOPE)) {
      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }

    let fansCount: number | undefined
    try {
      fansCount = await this.douyinMiniAppService.getFansCount(
        homepageCredential.accessToken,
        openId,
      )
    }
    catch {
      fansCount = undefined
    }

    return {
      accessToken: videoCredential.accessToken,
      refreshToken: videoCredential.refreshToken,
      expiresAt: new Date(Date.now() + Number(videoCredential.expiresIn) * 1000),
      scope: videoCredential.scope,
      tokenType: 'Bearer',
      platformUid: openId,
      profile: {
        platformUid: openId,
        displayName: callback.nickname || `抖音账号 ${this.maskOpenId(openId)}`,
        avatarUrl: callback.avatar,
        fansCount,
        raw: {
          openId,
          unionId,
          anonymousOpenId: sessionInfo.anonymousOpenid,
          followersCount: fansCount,
        },
      },
      callbackResponseType: AuthCallbackResponseType.Json,
      raw: {
        openId,
        unionId,
        homepageCredential,
        videoCredential,
      },
    }
  }

  private parseMiniAppCallback(input: AuthCallbackInput): DouyinMiniAppCallback | undefined {
    const payload = {
      state: input.query?.state ?? input.body?.state,
      token: input.query?.token ?? input.body?.token,
      nickname: input.query?.nickname ?? input.body?.nickname,
      avatar: input.query?.avatar ?? input.body?.avatar,
      tickets: input.body?.tickets,
    }
    if (payload.token === undefined && payload.tickets === undefined) {
      return undefined
    }

    const result = DouyinMiniAppCallbackSchema.safeParse(payload)
    if (!result.success) {
      const hasInvalidState = result.error.issues.some(issue => issue.path[0] === 'state')
      const hasInvalidToken = result.error.issues.some(issue => issue.path[0] === 'token')
      if (hasInvalidState) {
        throw new AppException(ResponseCode.ChannelAuthCsrfInvalid)
      }
      if (hasInvalidToken) {
        throw new AppException(ResponseCode.ChannelAuthCodeMissing)
      }

      throw new AppException(ResponseCode.ChannelAuthorizationFailed)
    }

    assertParsedCallbackState(result.data.state, input.session.id)
    return result.data
  }

  private hasMiniAppScope(scopes: string | undefined, scope: string) {
    return !!scopes?.split(/[,\s]+/).includes(scope)
  }

  private maskOpenId(openId: string) {
    if (openId.length <= 8) {
      return openId
    }

    return `${openId.slice(0, 4)}...${openId.slice(-4)}`
  }

  private buildMiniAppChannelAuthPath(state: string) {
    const query = new URLSearchParams({
      authType: 'channel',
      state,
    })

    return `pages/index/index?${query.toString()}`
  }

  private toImageDataUrl(base64: string) {
    return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
  }
}
