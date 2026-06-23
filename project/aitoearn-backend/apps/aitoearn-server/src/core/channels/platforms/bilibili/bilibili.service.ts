import type { AxiosError, AxiosInstance } from 'axios'
import type { BilibiliPlatformResponseBody } from './bilibili.exception'
import type {
  BilibiliApiResponse,
  BilibiliArchiveDetail,
  BilibiliArchiveListData,
  BilibiliArchiveStat,
  BilibiliArchiveSubmitBody,
  BilibiliArchiveSubmitResult,
  BilibiliArchiveTypeItem,
  BilibiliSignedRequestBody,
  BilibiliUploadInfo,
  BilibiliUserStat,
} from './bilibili.interface'
import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { BilibiliConfig } from './bilibili.config'
import { BilibiliPlatformException } from './bilibili.exception'
import { BilibiliOAuthGrantType } from './bilibili.interface'

@Injectable()
export class BilibiliService {
  private readonly logger = new Logger(BilibiliService.name)
  private readonly platformHttp: AxiosInstance

  constructor(
    private readonly cfg: BilibiliConfig,
    private readonly mediaService: MediaService,
  ) {
    this.platformHttp = this.createPlatformHttpClient()
  }

  private readonly authPageUrl = 'https://account.bilibili.com/pc/account-pc/auth/oauth'
  private readonly openBaseUrl = 'https://member.bilibili.com'

  private createPlatformHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      (response) => {
        if (BilibiliPlatformException.hasPlatformError(response)) {
          throw BilibiliPlatformException.fromPlatformResponse(response)
        }
        return response
      },
      (error: AxiosError<BilibiliPlatformResponseBody>) => {
        throw BilibiliPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      gourl: this.cfg.redirectUri,
      state,
    })

    return `${this.authPageUrl}?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
  }> {
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: BilibiliOAuthGrantType.AuthorizationCode,
      code,
    })
    const response = await this.platformHttp.post<BilibiliApiResponse<{
      access_token: string
      refresh_token: string
      expires_in: number
    }>>('https://api.bilibili.com/x/account-oauth2/v1/token', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!response.data.data) {
      throw new BilibiliPlatformException({
        code: ResponseCode.ChannelAccessTokenFailed,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'POST https://api.bilibili.com/x/account-oauth2/v1/token' },
        cause: { type: PlatformErrorCauseType.Platform },
      })
    }

    const { access_token, refresh_token, expires_in } = response.data.data

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
  }> {
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: BilibiliOAuthGrantType.RefreshToken,
      refresh_token: refreshToken,
    })
    const response = await this.platformHttp.post<BilibiliApiResponse<{
      access_token: string
      refresh_token: string
      expires_in: number
    }>>('https://api.bilibili.com/x/account-oauth2/v1/refresh_token', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!response.data.data) {
      throw new BilibiliPlatformException({
        code: ResponseCode.ChannelRefreshTokenFailed,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'POST https://api.bilibili.com/x/account-oauth2/v1/refresh_token' },
        cause: { type: PlatformErrorCauseType.Platform },
      })
    }

    const { access_token, refresh_token, expires_in } = response.data.data

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    // Bilibili Open Platform does not expose a server-side revoke endpoint for this OAuth token.
    void accessToken
  }

  async getUserInfo(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    fansCount?: number
    followingCount?: number
    archiveCount?: number
  }> {
    const data = await this.signedRequest<{
      openid: string
      name: string
      face?: string
    }>('GET', '/arcopen/fn/user/account/info', accessToken)
    let stat: {
      fansCount?: number
      followingCount?: number
      archiveCount?: number
    } = {}
    try {
      stat = await this.getUserStat(accessToken)
    }
    catch (err) {
      this.logger.warn(err, 'Failed to fetch Bilibili user stats')
    }

    return {
      platformUid: data.openid,
      displayName: data.name,
      avatarUrl: data.face,
      fansCount: stat.fansCount,
      followingCount: stat.followingCount,
      archiveCount: stat.archiveCount,
    }
  }

  async getUserStat(accessToken: string): Promise<{
    fansCount?: number
    followingCount?: number
    archiveCount?: number
  }> {
    const data = await this.signedRequest<BilibiliUserStat>(
      'GET',
      '/arcopen/fn/data/user/stat',
      accessToken,
    )

    return {
      fansCount: this.parseOptionalNumber(data.follower),
      followingCount: this.parseOptionalNumber(data.following),
      archiveCount: this.parseOptionalNumber(data.arc_passed_total),
    }
  }

  async getArchiveStat(
    accessToken: string,
    resourceId: string,
  ): Promise<BilibiliArchiveStat> {
    return this.signedRequest<BilibiliArchiveStat>(
      'GET',
      '/arcopen/fn/data/arc/stat',
      accessToken,
      undefined,
      { resource_id: resourceId },
    )
  }

  async listArchiveTypes(accessToken: string): Promise<BilibiliArchiveTypeItem[]> {
    return this.signedRequest<BilibiliArchiveTypeItem[]>(
      'GET',
      '/arcopen/fn/archive/type/list',
      accessToken,
    )
  }

  async listArchives(
    accessToken: string,
    params: {
      ps: number
      pn: number
      status?: string
    },
  ): Promise<BilibiliArchiveListData> {
    return this.signedRequest<BilibiliArchiveListData>(
      'GET',
      '/arcopen/fn/archive/viewlist',
      accessToken,
      undefined,
      {
        ps: String(params.ps),
        pn: String(params.pn),
        ...(params.status && { status: params.status }),
      },
    )
  }

  async uploadVideo(
    uploadToken: string,
    videoUrl: string,
  ): Promise<void> {
    await this.mediaService.withUploadSource({
      platform: AccountType.Bilibili,
      endpoint: 'downloadVideo',
      url: videoUrl,
    }, async (source) => {
      const chunkSize = 100 * 1024 * 1024
      const partCount = Math.max(1, Math.ceil(source.sizeBytes / chunkSize))

      for (let index = 0; index < partCount; index += 1) {
        const start = index * chunkSize
        const end = Math.min(source.sizeBytes, (index + 1) * chunkSize) - 1
        await this.platformHttp.post<BilibiliApiResponse<never>>(
          'https://openupos.bilivideo.com/video/v2/part/upload',
          source.stream({ start, end }),
          {
            params: {
              upload_token: uploadToken,
              part_number: (index + 1).toString(),
            },
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': String(end - start + 1),
            },
          },
        )
      }
    })
  }

  async submitArchive(
    accessToken: string,
    params: {
      title: string
      description?: string
      videoUrl: string
      coverUrl?: string
      topics?: string[]
      tid: number
      copyright?: 1 | 2
      noReprint?: 0 | 1
      source?: string
      topicId?: number
      missionId?: number
    },
  ): Promise<BilibiliArchiveSubmitResult> {
    const uploadInfo = await this.initVideoUpload(
      accessToken,
      this.resolveFileName(params.videoUrl, 'video.mp4'),
    )
    await this.uploadVideo(uploadInfo.uploadToken, params.videoUrl)
    await this.completeVideoUpload(accessToken, uploadInfo.uploadToken)
    const cover = params.coverUrl
      ? await this.uploadCover(accessToken, params.coverUrl)
      : undefined

    const body: BilibiliArchiveSubmitBody = {
      title: params.title,
      tid: params.tid,
      tag: params.topics?.join(',') ?? '',
      copyright: params.copyright ?? 1,
      no_reprint: params.noReprint ?? 0,
      desc: params.description ?? '',
      ...(cover ? { cover } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.topicId ? { topic_id: params.topicId } : {}),
      ...(params.missionId ? { mission_id: params.missionId } : {}),
    }

    const data = await this.signedRequest<{
      resource_id?: string
    }>(
      'POST',
      '/arcopen/fn/archive/add-by-utoken',
      accessToken,
      body,
      { upload_token: uploadInfo.uploadToken },
    )

    if (!data.resource_id) {
      throw new BilibiliPlatformException({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: { endpoint: 'POST /arcopen/fn/archive/add-by-utoken' },
        cause: { type: PlatformErrorCauseType.Platform },
      })
    }

    return {
      resourceId: data.resource_id,
    }
  }

  async uploadCover(
    accessToken: string,
    coverUrl: string,
  ): Promise<string> {
    const coverBuffer = await this.mediaService.getBuffer({
      platform: AccountType.Bilibili,
      endpoint: 'downloadCover',
      url: coverUrl,
    })

    const formData = new FormData()
    formData.append('file', new Blob([new Uint8Array(coverBuffer)]), this.resolveFileName(coverUrl, 'cover.jpg'))

    const response = await this.platformHttp.post<BilibiliApiResponse<{ url: string }>>(`${this.openBaseUrl}/arcopen/fn/archive/cover/upload`, formData, {
      headers: this.buildSignedHeaders(accessToken, '', 'multipart/form-data'),
    })

    if (!response.data.data?.url) {
      throw new BilibiliPlatformException({
        code: ResponseCode.ChannelPlatformMediaProcessingFailed,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: { endpoint: 'POST /arcopen/fn/archive/cover/upload' },
        cause: { type: PlatformErrorCauseType.Platform },
      })
    }

    return response.data.data.url
  }

  async getArchiveDetail(
    accessToken: string,
    bvid: string,
  ): Promise<BilibiliArchiveDetail> {
    const data = await this.signedRequest<{
      resource_id: string
      title: string
      desc: string
      addit_info: {
        state: number
        state_desc: string
      }
    }>('GET', '/arcopen/fn/archive/view', accessToken, undefined, {
      resource_id: bvid,
    })

    return {
      resourceId: data.resource_id,
      title: data.title,
      description: data.desc,
      state: data.addit_info.state,
      stateDesc: data.addit_info.state_desc,
    }
  }

  private async initVideoUpload(
    accessToken: string,
    fileName: string,
  ): Promise<BilibiliUploadInfo> {
    const data = await this.signedRequest<{
      upload_token: string
    }>('POST', '/arcopen/fn/archive/video/init', accessToken, {
      name: fileName,
      utype: '0',
    })

    return {
      uploadToken: data.upload_token,
    }
  }

  private async completeVideoUpload(
    accessToken: string,
    uploadToken: string,
  ): Promise<void> {
    await this.signedRequest(
      'POST',
      '/arcopen/fn/archive/video/complete',
      accessToken,
      undefined,
      { upload_token: uploadToken },
      false,
    )
  }

  private async signedRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    body?: BilibiliSignedRequestBody,
    params?: Record<string, string>,
  ): Promise<T>

  private async signedRequest(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    body: BilibiliSignedRequestBody | undefined,
    params: Record<string, string> | undefined,
    requiresData: false,
  ): Promise<void>

  private async signedRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    body?: BilibiliSignedRequestBody,
    params?: Record<string, string>,
    requiresData = true,
  ): Promise<T | void> {
    const bodyString = body ? JSON.stringify(body) : ''
    const response = await this.platformHttp.request<BilibiliApiResponse<T>>({
      method,
      url: `${this.openBaseUrl}${path}`,
      params,
      data: body,
      headers: this.buildSignedHeaders(accessToken, bodyString),
    })

    const data = response.data.data
    if (data === undefined) {
      if (!requiresData)
        return

      throw new BilibiliPlatformException({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: { endpoint: `${method} ${path}` },
        cause: { type: PlatformErrorCauseType.Platform },
      })
    }

    return data
  }

  private buildSignedHeaders(
    accessToken: string,
    bodyString: string,
    contentType = 'application/json',
  ): Record<string, string> {
    const contentMd5 = crypto.createHash('md5').update(bodyString).digest('hex')
    const accessKeyId = this.cfg.clientId
    const signatureMethod = 'HMAC-SHA256'
    const signatureNonce = crypto.randomUUID()
    const signatureVersion = '2.0'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signaturePayload = [
      ['x-bili-accesskeyid', accessKeyId],
      ['x-bili-content-md5', contentMd5],
      ['x-bili-signature-method', signatureMethod],
      ['x-bili-signature-nonce', signatureNonce],
      ['x-bili-signature-version', signatureVersion],
      ['x-bili-timestamp', timestamp],
    ]
      .map(([key, value]) => `${key}:${value}`)
      .join('\n')
    const authorization = crypto
      .createHmac('sha256', this.cfg.clientSecret)
      .update(signaturePayload)
      .digest('hex')

    return {
      'Accept': 'application/json',
      'Access-Token': accessToken,
      'Authorization': authorization,
      'Content-Type': contentType,
      'X-Bili-Accesskeyid': accessKeyId,
      'X-Bili-Content-Md5': contentMd5,
      'X-Bili-Signature-Method': signatureMethod,
      'X-Bili-Signature-Nonce': signatureNonce,
      'X-Bili-Signature-Version': signatureVersion,
      'X-Bili-Timestamp': timestamp,
    }
  }

  private resolveFileName(fileUrl: string, fallback: string): string {
    try {
      const pathName = new URL(fileUrl).pathname
      const fileName = pathName.split('/').filter(Boolean).pop()
      if (fileName) {
        return decodeURIComponent(fileName)
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to resolve Bilibili file name from ${fileUrl}`)
    }

    return fallback
  }

  private parseOptionalNumber(value: number | string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value)
  }
}
