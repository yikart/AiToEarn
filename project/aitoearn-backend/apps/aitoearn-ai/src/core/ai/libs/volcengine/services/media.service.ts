import type {
  VodGetMediaInfosRequest,
  VodGetMediaInfosResult,
  VodGetPlayInfoRequest,
  VodGetPlayInfoResult,
} from '@volcengine/openapi/lib/services/vod/types'
import * as crypto from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { VolcengineConfig } from '../volcengine.config'
import { BaseService } from './base.service'

/**
 * Volcengine 媒资服务
 * 负责媒资查询、播放信息获取、鉴权 URL 构建
 */
@Injectable()
export class MediaService extends BaseService {
  constructor(config: VolcengineConfig) {
    super(config)
  }

  /**
   * 获取媒资信息
   */
  async getMediaInfos(
    request: VodGetMediaInfosRequest,
  ): Promise<VodGetMediaInfosResult> {
    const options: VodGetMediaInfosRequest = {
      ...request,
    }

    const response = await this.vodService.GetMediaInfos(options)
    return response.Result!
  }

  /**
   * 获取播放信息
   */
  async getPlayInfo(
    request: VodGetPlayInfoRequest,
  ): Promise<VodGetPlayInfoResult> {
    const response = await this.vodService.GetPlayInfo(request)

    if (response.ResponseMetadata?.Error) {
      const error = response.ResponseMetadata.Error
      this.logger.error({ vid: request.Vid, code: error.Code, message: error.Message }, '获取播放信息失败')
    }

    if (response.Result?.PlayInfoList) {
      this.logger.debug({
        vid: request.Vid,
        count: response.Result.PlayInfoList.length,
        mainPlayUrl: response.Result.PlayInfoList[0]?.MainPlayUrl,
      }, '获取播放信息成功')
    }

    return response.Result!
  }

  /**
   * 构建带鉴权的播放URL
   * 使用A类型URL鉴权：MD5(自定义密钥 + 过期时间 + URI)
   */
  buildAuthenticatedPlayUrl(uri: string): string {
    const playbackBaseUrl = this.config.playbackBaseUrl
    const authKey = this.config.urlAuthPrimaryKey

    // URL鉴权参数
    const expirationTime = Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
    const timestamp = expirationTime.toString(16) // 转换为16进制

    // 生成签名：MD5(密钥 + 时间戳 + URI)
    const uriPath = uri.startsWith('/') ? uri : `/${uri}`
    const signString = `${authKey}${timestamp}${uriPath}`
    const md5Hash = crypto.createHash('md5').update(signString).digest('hex')

    // 构建URL：域名/URI?auth_key=时间戳-md5值
    const authParam = `${timestamp}-${md5Hash}`
    const fullUrl = `${playbackBaseUrl}${uriPath}?auth_key=${authParam}`

    this.logger.debug({ uri, timestamp, fullUrl }, '构建带鉴权URL成功')
    return fullUrl
  }
}
