import type { OpenApiResponse } from '@volcengine/openapi/lib/base/types'
import type { VodService } from '@volcengine/openapi/lib/services/vod'
import { Logger } from '@nestjs/common'
import { vodOpenapi } from '@volcengine/openapi'
import { AppException, ResponseCode } from '@yikart/common'
import { VolcengineConfig } from '../volcengine.config'

/**
 * Volcengine 服务基类
 * 提供共享的基础功能：配置、VodService、日志、错误处理
 */
export abstract class BaseService {
  protected readonly logger: Logger
  protected readonly vodService: VodService

  constructor(protected readonly config: VolcengineConfig) {
    this.vodService = this.createVodService()
    this.logger = new Logger(this.constructor.name)
  }

  /**
   * 获取播放基础 URL
   */
  getPlaybackBaseUrl(): string {
    return this.config.playbackBaseUrl
  }

  /**
   * 获取空间名称
   */
  getSpaceName(): string {
    return this.config.spaceName
  }

  /**
   * 创建视频点播服务实例
   */
  protected createVodService(): VodService {
    return new vodOpenapi.VodService({
      accessKeyId: this.config.accessKeyId,
      secretKey: this.config.secretAccessKey,
      serviceName: 'vod',
    })
  }

  /**
   * 检查 API 响应中的错误并抛出异常
   */
  protected checkApiResponseError<T>(
    response: OpenApiResponse<T>,
    operation: string,
    requestData?: unknown,
  ): asserts response is OpenApiResponse<T> & { Result: T } {
    if (response.ResponseMetadata?.Error) {
      const error = response.ResponseMetadata.Error
      this.logger.error(
        { error, requestData },
        `${operation} failed: ${error.Code || 'Unknown'} - ${error.Message}`,
      )
      throw new AppException(ResponseCode.AiCallFailed, {
        code: error.Code || 'Unknown',
        message: error.Message,
      })
    }

    if (!response.Result) {
      this.logger.error({ requestData }, `${operation} returned no result`)
      throw new AppException(ResponseCode.AiCallFailed, {
        message: typeof response === 'string' ? response : 'No result returned',
      })
    }
  }
}
