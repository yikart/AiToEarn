import type { Request, Response } from 'express'
import { Body, Controller, Get, Headers, Logger, Param, Post, Query, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, AppException, CookieName, getCodeMessage, getExceptionPayload, getLocale, ResponseCode } from '@yikart/common'
import { AuthCallbackResponseType } from '../platforms/platforms.interface'
import { getAuthCallbackState } from '../utils/auth-callback-state.util'
import {
  authViewMessages,
  clearChannelAuthSessionCookie,
  setChannelAuthSessionCookie,
} from '../utils/auth.utils'
import {
  AuthCallbackBodyDto,
  AuthCallbackQueryDto,
  StartAuthQueryDto,
  SubmitAuthSelectionsDto,
} from './auth.dto'
import { AuthService } from './auth.service'
import { AuthConnectedAccountVoSchema, AuthSelectableAccountVoSchema, AuthSessionStatusVo, AuthStartVo } from './auth.vo'

@ApiTags('Channels/Auth')
@Controller({ path: '/channels', version: '2' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiDoc({
    summary: '开始平台授权',
    description: '生成平台 OAuth 授权 URL',
    query: StartAuthQueryDto.schema,
    response: AuthStartVo,
  })
  @Get('/accounts/auth/:platform')
  async startAuth(
    @GetToken() token: TokenInfo,
    @Param('platform') platform: AccountType,
    @Query() query: StartAuthQueryDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.startAuth({
      userId: token.id,
      platform,
      callbackUrl: query.callbackUrl,
      redirectUri: query.redirectUri,
      groupId: query.groupId,
      userAgent,
    })
    setChannelAuthSessionCookie(res, result.sessionId, result.expiresAt)
    return AuthStartVo.create(result)
  }

  @ApiDoc({
    summary: '查询授权状态',
    description: '轮询平台授权 Session 状态',
    response: AuthSessionStatusVo,
  })
  @Get('/accounts/auth/:platform/status/:sessionId')
  async getAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('platform') platform: AccountType,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.authService.getAuthSessionResult(token.id, platform, sessionId)
    return AuthSessionStatusVo.create(result)
  }

  @ApiDoc({
    summary: '平台授权回调',
    description: '处理平台 OAuth callback (GET)',
    query: AuthCallbackQueryDto.schema,
  })
  @Public()
  @Get('/accounts/auth/:platform/callback')
  async handleCallbackGet(
    @Param('platform') platform: AccountType,
    @Query() query: AuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let sessionId: string | undefined
    try {
      sessionId = this.getCallbackSessionId(req, { query })
      const result = await this.authService.completeCallback(
        platform,
        { query },
        sessionId,
      )
      return this.renderCallbackResult(res, result, sessionId)
    }
    catch (error) {
      const callbackSessionId = sessionId ?? this.getOptionalCallbackSessionId(req, { query }) ?? 'unknown'
      await this.markCallbackSessionFailed(sessionId ?? this.getOptionalCallbackSessionId(req, { query }), this.getErrorCode(error))
      this.logger.error(error, `Channel auth callback failed: platform=${platform}, sessionId=${callbackSessionId}`)
      return this.renderCallbackError(res, error, platform)
    }
  }

  @ApiDoc({
    summary: '平台授权回调 (POST)',
    description: '处理平台 OAuth callback POST 请求',
    query: AuthCallbackQueryDto.schema,
    body: AuthCallbackBodyDto.schema,
  })
  @Public()
  @Post('/accounts/auth/:platform/callback')
  async handleCallbackPost(
    @Param('platform') platform: AccountType,
    @Body() body: AuthCallbackBodyDto,
    @Query() query: AuthCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let sessionId: string | undefined
    try {
      sessionId = this.getCallbackSessionId(req, { query, body })
      const result = await this.authService.completeCallback(
        platform,
        { query, body },
        sessionId,
      )
      return this.renderCallbackResult(res, result, sessionId)
    }
    catch (error) {
      await this.markCallbackSessionFailed(sessionId ?? this.getOptionalCallbackSessionId(req, { query, body }), this.getErrorCode(error))
      throw error
    }
  }

  private renderCallbackResult(res: Response, result: Awaited<ReturnType<AuthService['completeCallback']>>, sessionId: string) {
    if (result.callbackResponseType === AuthCallbackResponseType.Json) {
      const accounts = result.connectedAccounts
        ? AuthConnectedAccountVoSchema.array().parse(result.connectedAccounts)
        : AuthSelectableAccountVoSchema.array().parse(result.accounts ?? [])
      clearChannelAuthSessionCookie(res)
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Pragma', 'no-cache')
      return res.json({
        status: result.requiresSelection ? 0 : 1,
        accountId: result.accountId,
        accounts,
        requiresSelection: Boolean(result.requiresSelection),
      })
    }

    const locale = getLocale()
    if (result.requiresSelection) {
      setChannelAuthSessionCookie(res, sessionId)
      return res.render('channels/auth/select-accounts', {
        ...result,
        locale,
        messages: authViewMessages[locale],
      })
    }

    clearChannelAuthSessionCookie(res)
    return res.render('channels/auth/callback', {
      status: 1,
      accountId: result.accountId,
      accounts: result.connectedAccounts ?? [],
      locale,
      platformDisplayName: result.platformDisplayName,
      platformLogoUrl: result.platformLogoUrl,
      messages: authViewMessages[locale],
      callbackUrl: result.callbackUrl,
      redirectUri: result.redirectUri,
    })
  }

  @ApiDoc({
    summary: '提交二级账号选择',
    description: '用户选择要绑定的二级账号',
    body: SubmitAuthSelectionsDto.schema,
  })
  @Public()
  @Post('/accounts/auth/selections')
  async submitSelections(
    @Body() body: SubmitAuthSelectionsDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionId = this.getAuthSessionId(req)
    const result = await this.authService.connectSelectableAccounts(
      sessionId,
      body.accounts,
    )
    clearChannelAuthSessionCookie(res)
    const locale = getLocale()
    return res.render('channels/auth/callback', {
      status: 1,
      accountId: result.accountIds[0],
      accounts: result.accounts,
      locale,
      platformDisplayName: result.platformDisplayName,
      platformLogoUrl: result.platformLogoUrl,
      messages: authViewMessages[locale],
      callbackUrl: result.callbackUrl,
      redirectUri: result.redirectUri,
    })
  }

  private getAuthSessionId(
    req: Request,
  ): string {
    const sessionId = req.cookies?.[CookieName.ChannelAuthSession]

    if (sessionId) {
      return sessionId
    }
    throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
  }

  private getCallbackSessionId(
    req: Request,
    callbackInput: { query?: AuthCallbackQueryDto, body?: AuthCallbackBodyDto },
  ): string {
    const sessionId = this.getOptionalCallbackSessionId(req, callbackInput)
    if (sessionId) {
      return sessionId
    }

    throw new AppException(ResponseCode.ChannelAuthSessionInvalid)
  }

  private getOptionalCallbackSessionId(
    req: Request,
    callbackInput: { query?: AuthCallbackQueryDto, body?: AuthCallbackBodyDto },
  ): string | undefined {
    return getAuthCallbackState(callbackInput) ?? req.cookies?.[CookieName.ChannelAuthSession]
  }

  private renderCallbackError(res: Response, error: unknown, platform: AccountType) {
    clearChannelAuthSessionCookie(res)
    const locale = getLocale()
    const payload = getExceptionPayload(error)
    const errorCode = this.getErrorCode(error)
    const errorMessage = this.isResponseCode(errorCode)
      ? getCodeMessage(errorCode, payload.data, locale)
      : payload.message
    const platformViewFields = this.getPlatformErrorViewFields(platform)

    return res.render('channels/auth/error', {
      locale,
      messages: authViewMessages[locale],
      ...platformViewFields,
      errorCode,
      errorMessage,
    })
  }

  private async markCallbackSessionFailed(sessionId: string | undefined, errorCode: number): Promise<void> {
    if (!sessionId) {
      return
    }
    await this.authService.markSessionFailed(sessionId, errorCode)
  }

  private getPlatformErrorViewFields(platform: AccountType) {
    try {
      return this.authService.getPlatformAuthViewFields(platform)
    }
    catch {
      return {
        platformDisplayName: String(platform),
        platformLogoUrl: undefined,
      }
    }
  }

  private isResponseCode(code: number): code is ResponseCode {
    return Object.hasOwn(ResponseCode, code)
  }

  private getErrorCode(error: unknown): number {
    const payload = getExceptionPayload(error)
    return typeof payload.code === 'number'
      ? payload.code
      : 500
  }
}
