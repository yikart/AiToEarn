import type { OpenApiResponse } from '@volcengine/openapi/lib/base/types'
import type { VodService } from '@volcengine/openapi/lib/services/vod'
import type {
  VodCommitUploadInfoResult,
  VodGetMediaInfosRequest,
  VodGetMediaInfosResult,
  VodGetPlayInfoRequest,
  VodGetPlayInfoResult,
  VodQueryUploadTaskInfoRequest,
  VodQueryUploadTaskInfoResult,
  VodUploadMaterialRequest,
  VodUploadMediaByUrlRequest,
  VodUploadMediaByUrlResult,
} from '@volcengine/openapi/lib/services/vod/types'
import type {
  AsyncVCreativeTaskRequest,
  AsyncVCreativeTaskResponse,
  CreateDramaRecapTaskRequest,
  CreateDramaRecapTaskResponse,
  CreateVideoGenerationTaskRequest,
  GetAideoTaskResultRequest,
  GetAideoTaskResultResponse,
  GetDirectEditResultItem,
  GetDirectEditResultRequest,
  GetVCreativeTaskResultRequest,
  GetVCreativeTaskResultResponse,
  GetVideoGenerationTaskResponse,
  MultiInput,
  QueryDramaRecapTaskRequest,
  QueryDramaRecapTaskResponse,
  SkillParams,
  SubmitAideoTaskAsyncResponse,
  SubmitDirectEditTaskAsyncRequest,
  SubmitDirectEditTaskAsyncResponse,
  VideoInput,
  VideoUrlInput,
} from './volcengine.interface'
import { Injectable, Logger } from '@nestjs/common'
import { vodOpenapi } from '@volcengine/openapi'
import { AppException, ResponseCode } from '@yikart/common'
import { AideoService } from './services/aideo.service'
import { DirectEditService } from './services/direct-edit.service'
import { DramaRecapService } from './services/drama-recap.service'
import { MediaService } from './services/media.service'
import { UploadService } from './services/upload.service'
import { VCreativeService } from './services/vcreative.service'
import { VideoGenService } from './services/video-gen.service'
import { VolcengineConfig } from './volcengine.config'
import { SkillType } from './volcengine.interface'

/**
 * Volcengine 服务 Facade
 * 提供统一的 API 访问入口，委托到各专门服务
 * 保持向后兼容：所有原有方法签名保持不变
 */
@Injectable()
export class VolcengineService {
  private readonly logger = new Logger(VolcengineService.name)
  private readonly vodService: VodService

  constructor(
    private readonly config: VolcengineConfig,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService,
    private readonly videoGenService: VideoGenService,
    private readonly aideoService: AideoService,
    private readonly vCreativeService: VCreativeService,
    private readonly directEditService: DirectEditService,
    private readonly dramaRecapService: DramaRecapService,
  ) {
    this.vodService = this.createVodService()
  }

  // ========== 配置方法 ==========

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

  // ========== 上传服务 (委托到 VolcengineUploadService) ==========

  /**
   * URL 批量拉取上传
   */
  async uploadMediaByUrl(
    request: VodUploadMediaByUrlRequest,
  ): Promise<VodUploadMediaByUrlResult> {
    return this.uploadService.uploadMediaByUrl(request)
  }

  /**
   * 流式上传
   */
  async uploadMaterial(
    request: VodUploadMaterialRequest,
  ): Promise<VodCommitUploadInfoResult> {
    return this.uploadService.uploadMaterial(request)
  }

  /**
   * 查询上传任务状态
   * @deprecated 使用 getUploadTaskInfo 代替
   */
  async queryUploadTaskInfo(
    request: VodQueryUploadTaskInfoRequest,
  ): Promise<VodQueryUploadTaskInfoResult> {
    return this.uploadService.getUploadTaskInfo(request)
  }

  /**
   * 获取上传任务状态
   */
  async getUploadTaskInfo(
    request: VodQueryUploadTaskInfoRequest,
  ): Promise<VodQueryUploadTaskInfoResult> {
    return this.uploadService.getUploadTaskInfo(request)
  }

  /**
   * 下载 URL 并使用 stream 方式上传
   */
  async downloadUrlAndUploadAsStream(
    url: string,
    options?: VideoUrlInput,
  ): Promise<string> {
    return this.uploadService.downloadUrlAndUploadAsStream(url, options)
  }

  // ========== 媒资服务 (委托到 VolcengineMediaService) ==========

  /**
   * 获取媒资信息
   */
  async getMediaInfos(
    request: VodGetMediaInfosRequest,
  ): Promise<VodGetMediaInfosResult> {
    return this.mediaService.getMediaInfos(request)
  }

  /**
   * 获取播放信息
   */
  async getPlayInfo(
    request: VodGetPlayInfoRequest,
  ): Promise<VodGetPlayInfoResult> {
    return this.mediaService.getPlayInfo(request)
  }

  /**
   * 构建带鉴权的播放URL
   */
  async buildAuthenticatedPlayUrl(uri: string): Promise<string> {
    return this.mediaService.buildAuthenticatedPlayUrl(uri)
  }

  // ========== 视频生成服务 (委托到 VolcengineVideoGenService) ==========

  /**
   * 创建视频生成任务
   */
  async createVideoGenerationTask(
    request: CreateVideoGenerationTaskRequest,
  ) {
    return this.videoGenService.createVideoGenerationTask(request)
  }

  /**
   * 查询视频生成任务
   */
  async getVideoGenerationTask(
    taskId: string,
  ): Promise<GetVideoGenerationTaskResponse> {
    return this.videoGenService.getVideoGenerationTask(taskId)
  }

  /**
   * 取消或删除视频生成任务
   */
  async deleteVideoGenerationTask(
    taskId: string,
  ) {
    return this.videoGenService.deleteVideoGenerationTask(taskId)
  }

  // ========== Aideo 服务 (委托到 VolcengineAideoService) ==========

  /**
   * 提交异步智能视频处理任务
   */
  async submitAideoTaskAsync(
    request:
      | {
        SpaceName?: string
        MultiInputs: MultiInput[]
        Prompt: string
      }
      | {
        SpaceName?: string
        MultiInputs: MultiInput[]
        SkillType: SkillType
        SkillParams?: SkillParams
      },
  ): Promise<SubmitAideoTaskAsyncResponse> {
    return this.aideoService.submitAideoTaskAsync(request)
  }

  /**
   * 获取异步智能视频处理任务结果
   */
  async getAideoTaskResult(
    request: GetAideoTaskResultRequest,
  ): Promise<GetAideoTaskResultResponse> {
    return this.aideoService.getAideoTaskResult(request)
  }

  /**
   * 智能视频上传并提交异步智能视频处理任务
   */
  async submitAideoTaskAsyncWithUpload(
    request:
      | {
        SpaceName?: string
        MultiInputs: VideoInput[]
        Prompt: string
      }
      | {
        SpaceName?: string
        MultiInputs: VideoInput[]
        SkillType: SkillType
        SkillParams?: SkillParams
      },
  ): Promise<SubmitAideoTaskAsyncResponse & { vids: string[] }> {
    return this.aideoService.submitAideoTaskAsyncWithUpload(request)
  }

  // ========== VCreative 服务 (委托到 VolcengineVCreativeService) ==========

  /**
   * 提交 AI 漫剧转绘任务
   */
  async asyncVCreativeTask(
    request: AsyncVCreativeTaskRequest,
  ): Promise<AsyncVCreativeTaskResponse> {
    return this.vCreativeService.asyncVCreativeTask(request)
  }

  /**
   * 获取 AI 漫剧转绘任务结果
   */
  async getVCreativeTaskResult(
    request: GetVCreativeTaskResultRequest,
  ): Promise<GetVCreativeTaskResultResponse> {
    return this.vCreativeService.getVCreativeTaskResult(request)
  }

  // ========== DirectEdit 服务 (委托到 VolcengineDirectEditService) ==========

  /**
   * 提交异步剪辑任务
   */
  async submitDirectEditTaskAsync(
    request: SubmitDirectEditTaskAsyncRequest,
  ): Promise<SubmitDirectEditTaskAsyncResponse> {
    return this.directEditService.submitDirectEditTaskAsync(request)
  }

  /**
   * 获取剪辑任务结果
   */
  async getDirectEditResult(
    request: GetDirectEditResultRequest,
  ): Promise<GetDirectEditResultItem> {
    return this.directEditService.getDirectEditResult(request)
  }

  // ========== DramaRecap 服务 (委托到 VolcengineDramaRecapService) ==========

  /**
   * 创建短剧解说任务
   */
  async createDramaRecapTask(
    request: CreateDramaRecapTaskRequest,
  ): Promise<CreateDramaRecapTaskResponse> {
    return this.dramaRecapService.createDramaRecapTask(request)
  }

  /**
   * 查询短剧解说任务结果
   * @deprecated 使用 getDramaRecapTask 代替
   */
  async queryDramaRecapTask(
    request: QueryDramaRecapTaskRequest,
  ): Promise<QueryDramaRecapTaskResponse> {
    return this.dramaRecapService.getDramaRecapTask(request)
  }

  /**
   * 获取短剧解说任务结果
   */
  async getDramaRecapTask(
    request: QueryDramaRecapTaskRequest,
  ): Promise<QueryDramaRecapTaskResponse> {
    return this.dramaRecapService.getDramaRecapTask(request)
  }

  // ========== 内部辅助方法 ==========

  /**
   * 创建视频点播服务实例
   */
  private createVodService(): VodService {
    return new vodOpenapi.VodService({
      accessKeyId: this.config.accessKeyId,
      secretKey: this.config.secretAccessKey,
      serviceName: 'vod',
    })
  }

  /**
   * 检查 API 响应中的错误并抛出异常（内部方法）
   */
  private checkApiResponseError<T>(
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
