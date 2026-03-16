import type {
  AsyncVCreativeTaskRequest,
  AsyncVCreativeTaskResponse,
  GetVCreativeTaskResultRequest,
  GetVCreativeTaskResultResponse,
} from '../volcengine.interface'
import { Injectable } from '@nestjs/common'
import { getErrorDetail } from '@yikart/common'
import { isAxiosError } from 'axios'
import { VolcengineConfig } from '../volcengine.config'
import { BaseService } from './base.service'

/**
 * Volcengine VCreative 服务
 * 负责 AI 漫剧转绘任务
 */
@Injectable()
export class VCreativeService extends BaseService {
  constructor(config: VolcengineConfig) {
    super(config)
  }

  /**
   * 提交 AI 漫剧转绘任务
   * 文档：https://www.volcengine.com/docs/4/1924630
   * POST https://vod.volcengineapi.com?Action=AsyncVCreativeTask&Version=2018-01-01
   */
  async asyncVCreativeTask(
    request: AsyncVCreativeTaskRequest,
  ): Promise<AsyncVCreativeTaskResponse> {
    try {
      const api = this.vodService.createAPI<
        Record<string, unknown>,
        AsyncVCreativeTaskResponse
      >('AsyncVCreativeTask', {
        Version: '2018-01-01',
        method: 'POST',
        contentType: 'json',
      })

      // ParamObj 应该是对象，API 会自动序列化
      const requestData: Record<string, unknown> = {
        Scene: request.Scene,
        Uploader: request.Uploader,
        ParamObj: typeof request.ParamObj === 'string' ? JSON.parse(request.ParamObj) : request.ParamObj,
      }

      this.logger.debug({
        scene: requestData['Scene'],
        uploader: requestData['Uploader'],
        paramObj: requestData['ParamObj'],
      }, '[AsyncVCreativeTask] 提交任务')

      const response = await api(requestData)

      this.logger.debug({
        vCreativeId: response.Result?.VCreativeId,
        responseMetadata: response.ResponseMetadata,
      }, '[AsyncVCreativeTask] 任务提交成功')

      // 检查响应中的错误
      this.checkApiResponseError(response, 'Submit AsyncVCreativeTask', requestData)

      return response.Result
    }
    catch (error) {
      // 详细记录错误
      const errorDetails = isAxiosError(error)
        ? {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            request: {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL,
              data: error.config?.data,
            },
          }
        : getErrorDetail(error)

      this.logger.error(errorDetails, 'AsyncVCreativeTask请求失败')
      throw error
    }
  }

  /**
   * 获取 AI 漫剧转绘任务结果
   * 文档：https://www.volcengine.com/docs/4/1924630
   * GET https://vod.volcengineapi.com?Action=GetVCreativeTaskResult&Version=2018-01-01&VCreativeId=xxx
   */
  async getVCreativeTaskResult(
    request: GetVCreativeTaskResultRequest,
  ): Promise<GetVCreativeTaskResultResponse> {
    try {
      this.logger.debug({
        vCreativeId: request.VCreativeId,
      }, '[getVCreativeTaskResult] 查询任务')

      const api = this.vodService.createAPI<
        Record<string, unknown>,
        GetVCreativeTaskResultResponse
      >('GetVCreativeTaskResult', {
        Version: '2018-01-01',
        method: 'GET',
        contentType: 'json',
      })

      const requestData: Record<string, unknown> = {
        VCreativeId: request.VCreativeId,
      }

      const response = await api(requestData)

      this.logger.debug({
        vCreativeId: request.VCreativeId,
        status: response.Result?.Status,
        uploader: response.Result?.['Uploader'],
        workflowId: response.Result?.['WorkflowId'],
        hasOutputJson: !!response.Result?.OutputJson,
        outputJsonPreview: response.Result?.OutputJson
          ? (response.Result.OutputJson.length > 200
              ? `${response.Result.OutputJson.substring(0, 200)}...`
              : response.Result.OutputJson)
          : undefined,
      }, '[getVCreativeTaskResult] 收到响应')

      // 检查响应中的错误
      this.checkApiResponseError(response, 'Get VCreativeTask result', requestData)

      return response.Result
    }
    catch (error) {
      const errorDetails = isAxiosError(error)
        ? {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
          }
        : getErrorDetail(error)

      this.logger.error(errorDetails, '[getVCreativeTaskResult] 请求失败')
      throw error
    }
  }
}
