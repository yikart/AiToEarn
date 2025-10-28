import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import jwt from 'jsonwebtoken'
import { KlingConfig } from './kling.config'
import {
  // 图生视频相关类型
  Image2VideoCreateTaskRequest,

  Image2VideoCreateTaskResponseData,
  Image2VideoGetTaskResponseData,
  Image2VideoGetTasksResponseData,
  // 通用类型
  KlingResponse,

  // 对口型相关类型
  LipSyncCreateTaskRequest,
  LipSyncCreateTaskResponseData,
  LipSyncGetTaskResponseData,
  LipSyncGetTasksResponseData,

  MultiElementsAddSelectionRequest,
  MultiElementsClearSelectionRequest,
  MultiElementsCreateTaskRequest,
  MultiElementsCreateTaskResponseData,

  MultiElementsDeleteSelectionRequest,
  MultiElementsGetTaskResponseData,
  MultiElementsGetTasksResponseData,
  // 多模态视频编辑相关类型
  MultiElementsInitSelectionRequest,
  MultiElementsInitSelectionResponseData,
  MultiElementsPreviewSelectionRequest,
  MultiElementsPreviewSelectionResponseData,
  MultiElementsSelectionResponseData,
  // 多图生视频相关类型
  MultiImage2VideoCreateTaskRequest,
  MultiImage2VideoCreateTaskResponseData,
  MultiImage2VideoGetTaskResponseData,
  MultiImage2VideoGetTasksResponseData,

  // 文生视频相关类型
  Text2VideoCreateTaskRequest,
  Text2VideoCreateTaskResponseData,
  Text2VideoGetTaskResponseData,
  Text2VideoGetTasksResponseData,

  // 视频特效相关类型
  VideoEffectsCreateTaskRequest,
  VideoEffectsCreateTaskResponseData,
  VideoEffectsGetTaskResponseData,
  VideoEffectsGetTasksResponseData,

  // 视频延长相关类型
  VideoExtendCreateTaskRequest,
  VideoExtendCreateTaskResponseData,
  VideoExtendGetTaskResponseData,
  VideoExtendGetTasksResponseData,
} from './kling.interface'

@Injectable()
export class KlingService {
  private readonly logger = new Logger(KlingService.name)

  private readonly httpClient: AxiosInstance

  constructor(private readonly config: KlingConfig) {
    this.httpClient = axios.create({
      timeout: 30000,
      baseURL: config.baseUrl,
    })

    // 添加请求拦截器
    this.httpClient.interceptors.request.use((config) => {
      let token
      if (this.config.secretKey) {
        const now = Math.floor(Date.now() / 1000)
        token = jwt.sign(
          {
            iss: this.config.accessKey,
            exp: now + 1800,
            nbf: now - 5,
          },
          this.config.secretKey,
          {
            algorithm: 'HS256',
          },
        )
      }
      else {
        token = this.config.accessKey
      }
      this.logger.debug({
        token,
      })
      config.headers.Authorization = `Bearer ${token}`
      config.headers['Content-Type'] = 'application/json'
      return config
    })

    const resInterceptor = (response: AxiosResponse) => {
      this.logger.debug({
        data: response.data,
      })
      const klingResponse = response.data as KlingResponse<unknown>
      if (klingResponse.code !== 0) {
        this.logger.error({
          data: response.data,
          msg: '可灵 api 调用失败',
        })
        throw new AppException(ResponseCode.AiCallFailed, klingResponse.message)
      }
      return response
    }
    this.httpClient.interceptors.response.use(resInterceptor)
  }

  // ==================== 文生视频相关方法 ====================

  /**
   * 创建文生视频任务
   * POST /v1/videos/text2video
   */
  async createText2VideoTask(
    request: Text2VideoCreateTaskRequest,
  ): Promise<KlingResponse<Text2VideoCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<Text2VideoCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/text2video`,
        request,
      )

    return response.data
  }

  /**
   * 查询文生视频任务（单个）
   * GET /v1/videos/text2video/{id}
   */
  async getText2VideoTask(
    taskId: string,
  ): Promise<KlingResponse<Text2VideoGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<Text2VideoGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/text2video/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询文生视频任务列表
   * GET /v1/videos/text2video
   */
  async getText2VideoTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<Text2VideoGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<Text2VideoGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/text2video?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 图生视频相关方法 ====================

  /**
   * 创建图生视频任务
   * POST /v1/videos/image2video
   */
  async createImage2VideoTask(
    request: Image2VideoCreateTaskRequest,
  ): Promise<KlingResponse<Image2VideoCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<Image2VideoCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/image2video`,
        request,
      )

    return response.data
  }

  /**
   * 查询图生视频任务（单个）
   * GET /v1/videos/image2video/{id}
   */
  async getImage2VideoTask(
    taskId: string,
  ): Promise<KlingResponse<Image2VideoGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<Image2VideoGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/image2video/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询图生视频任务列表
   * GET /v1/videos/image2video
   */
  async getImage2VideoTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<Image2VideoGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<Image2VideoGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/image2video?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 多图生视频相关方法 ====================

  /**
   * 创建多图生视频任务
   * POST /v1/videos/multi-image2video
   */
  async createMultiImage2VideoTask(
    request: MultiImage2VideoCreateTaskRequest,
  ): Promise<KlingResponse<MultiImage2VideoCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiImage2VideoCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-image2video`,
        request,
      )

    return response.data
  }

  /**
   * 查询多图生视频任务（单个）
   * GET /v1/videos/multi-image2video/{id}
   */
  async getMultiImage2VideoTask(
    taskId: string,
  ): Promise<KlingResponse<MultiImage2VideoGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiImage2VideoGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/multi-image2video/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询多图生视频任务列表
   * GET /v1/videos/multi-image2video
   */
  async getMultiImage2VideoTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<MultiImage2VideoGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiImage2VideoGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/multi-image2video?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 多模态视频编辑相关方法 ====================

  /**
   * 初始化待编辑视频
   * POST /v1/videos/multi-elements/init-selection
   */
  async initMultiElementsSelection(
    request: MultiElementsInitSelectionRequest,
  ): Promise<KlingResponse<MultiElementsInitSelectionResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsInitSelectionResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements/init-selection`,
        request,
      )

    return response.data
  }

  /**
   * 增加视频选区
   * POST /v1/videos/multi-elements/add-selection
   */
  async addMultiElementsSelection(
    request: MultiElementsAddSelectionRequest,
  ): Promise<KlingResponse<MultiElementsSelectionResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsSelectionResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements/add-selection`,
        request,
      )

    return response.data
  }

  /**
   * 删减视频选区
   * POST /v1/videos/multi-elements/delete-selection
   */
  async deleteMultiElementsSelection(
    request: MultiElementsDeleteSelectionRequest,
  ): Promise<KlingResponse<MultiElementsSelectionResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsSelectionResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements/delete-selection`,
        request,
      )

    return response.data
  }

  /**
   * 清除视频选区
   * POST /v1/videos/multi-elements/clear-selection
   */
  async clearMultiElementsSelection(
    request: MultiElementsClearSelectionRequest,
  ): Promise<KlingResponse<{ status: number, session_id: string }>> {
    const response: AxiosResponse<KlingResponse<{ status: number, session_id: string }>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements/clear-selection`,
        request,
      )

    return response.data
  }

  /**
   * 预览已选区视频
   * POST /v1/videos/multi-elements/preview-selection
   */
  async previewMultiElementsSelection(
    request: MultiElementsPreviewSelectionRequest,
  ): Promise<KlingResponse<MultiElementsPreviewSelectionResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsPreviewSelectionResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements/preview-selection`,
        request,
      )

    return response.data
  }

  /**
   * 创建多模态视频编辑任务
   * POST /v1/videos/multi-elements
   */
  async createMultiElementsTask(
    request: MultiElementsCreateTaskRequest,
  ): Promise<KlingResponse<MultiElementsCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/multi-elements`,
        request,
      )

    return response.data
  }

  /**
   * 查询多模态视频编辑任务（单个）
   * GET /v1/videos/multi-elements/{id}
   */
  async getMultiElementsTask(
    taskId: string,
  ): Promise<KlingResponse<MultiElementsGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/multi-elements/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询多模态视频编辑任务列表
   * GET /v1/videos/multi-elements
   */
  async getMultiElementsTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<MultiElementsGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<MultiElementsGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/multi-elements?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 对口型相关方法 ====================

  /**
   * 创建对口型任务
   * POST /v1/videos/lip-sync
   */
  async createLipSyncTask(
    request: LipSyncCreateTaskRequest,
  ): Promise<KlingResponse<LipSyncCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<LipSyncCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/lip-sync`,
        request,
      )

    return response.data
  }

  /**
   * 查询对口型任务（单个）
   * GET /v1/videos/lip-sync/{id}
   */
  async getLipSyncTask(
    taskId: string,
  ): Promise<KlingResponse<LipSyncGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<LipSyncGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/lip-sync/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询对口型任务列表
   * GET /v1/videos/lip-sync
   */
  async getLipSyncTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<LipSyncGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<LipSyncGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/lip-sync?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 视频特效相关方法 ====================

  /**
   * 创建视频特效任务
   * POST /v1/videos/effects
   */
  async createVideoEffectsTask(
    request: VideoEffectsCreateTaskRequest,
  ): Promise<KlingResponse<VideoEffectsCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoEffectsCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/effects`,
        request,
      )

    return response.data
  }

  /**
   * 查询视频特效任务（单个）
   * GET /v1/videos/effects/{id}
   */
  async getVideoEffectsTask(
    taskId: string,
  ): Promise<KlingResponse<VideoEffectsGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoEffectsGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/effects/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询视频特效任务列表
   * GET /v1/videos/effects
   */
  async getVideoEffectsTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<VideoEffectsGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoEffectsGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/effects?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }

  // ==================== 视频延长相关方法 ====================

  /**
   * 创建视频延长任务
   * POST /v1/videos/video-extend
   */
  async createVideoExtendTask(
    request: VideoExtendCreateTaskRequest,
  ): Promise<KlingResponse<VideoExtendCreateTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoExtendCreateTaskResponseData>>
      = await this.httpClient.post(
        `/v1/videos/video-extend`,
        request,
      )

    return response.data
  }

  /**
   * 查询视频延长任务（单个）
   * GET /v1/videos/video-extend/{id}
   */
  async getVideoExtendTask(
    taskId: string,
  ): Promise<KlingResponse<VideoExtendGetTaskResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoExtendGetTaskResponseData>>
      = await this.httpClient.get(
        `/v1/videos/video-extend/${taskId}`,
      )

    return response.data
  }

  /**
   * 查询视频延长任务列表
   * GET /v1/videos/video-extend
   */
  async getVideoExtendTasks(
    pageNum = 1,
    pageSize = 30,
  ): Promise<KlingResponse<VideoExtendGetTasksResponseData>> {
    const response: AxiosResponse<KlingResponse<VideoExtendGetTasksResponseData>>
      = await this.httpClient.get(
        `/v1/videos/video-extend?pageNum=${pageNum}&pageSize=${pageSize}`,
      )

    return response.data
  }
}
