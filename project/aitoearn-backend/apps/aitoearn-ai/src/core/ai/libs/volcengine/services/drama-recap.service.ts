import type {
  CreateDramaRecapTaskRequest,
  CreateDramaRecapTaskResponse,
  QueryDramaRecapTaskRequest,
  QueryDramaRecapTaskResponse,
} from '../volcengine.interface'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { VolcengineConfig } from '../volcengine.config'
import { DramaRecapTaskStatus } from '../volcengine.interface'
import { BaseService } from './base.service'

/**
 * Volcengine DramaRecap 服务
 * 负责短剧解说任务
 */
@Injectable()
export class DramaRecapService extends BaseService {
  constructor(config: VolcengineConfig) {
    super(config)
  }

  /**
   * 创建短剧解说任务
   * 文档：https://www.volcengine.com/docs/4/1864791
   */
  async createDramaRecapTask(
    request: CreateDramaRecapTaskRequest,
  ): Promise<CreateDramaRecapTaskResponse> {
    const api = this.vodService.createAPI<
      CreateDramaRecapTaskRequest,
      CreateDramaRecapTaskResponse
    >('CreateDramaRecapTask', {
      Version: '2025-03-03',
      method: 'POST',
      contentType: 'json',
    })
    const response = await api(request)

    this.checkApiResponseError(response, 'CreateDramaRecapTask', request)

    return response.Result!
  }

  /**
   * 查询短剧解说任务结果
   * 文档：https://www.volcengine.com/docs/4/1864790
   * @deprecated 使用 getDramaRecapTask 代替
   */
  async queryDramaRecapTask(
    request: QueryDramaRecapTaskRequest,
  ): Promise<QueryDramaRecapTaskResponse> {
    return this.getDramaRecapTask(request)
  }

  /**
   * 获取短剧解说任务结果
   * 文档：https://www.volcengine.com/docs/4/1864790
   */
  async getDramaRecapTask(
    request: QueryDramaRecapTaskRequest,
  ): Promise<QueryDramaRecapTaskResponse> {
    const api = this.vodService.createAPI<
      QueryDramaRecapTaskRequest,
      QueryDramaRecapTaskResponse
    >('QueryDramaRecapTask', {
      Version: '2025-03-03',
      method: 'GET',
      contentType: 'json',
    })
    const response = await api(request)
    // 检查 API 响应中的错误
    if (response.ResponseMetadata?.Error) {
      const error = response.ResponseMetadata.Error
      this.logger.error(
        { error, requestData: request },
        `QueryDramaRecapTask failed: ${error.Code || 'Unknown'} - ${error.Message}`,
      )
      throw new AppException(ResponseCode.AiCallFailed, {
        code: error.Code || 'Unknown',
        message: error.Message,
      })
    }

    // 对于短剧解说任务，Result 可能为空（任务刚提交还在准备中）
    // 返回一个默认的处理中状态，让上层继续轮询
    if (!response.Result) {
      this.logger.debug({ taskId: request.TaskId }, '[getDramaRecapTask] Result 为空，任务可能还在准备中')
      return {
        TaskId: request.TaskId,
        Status: DramaRecapTaskStatus.Processing,
      }
    }

    return response.Result
  }
}
