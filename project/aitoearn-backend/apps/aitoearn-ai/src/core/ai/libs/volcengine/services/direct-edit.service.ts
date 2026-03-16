import type {
  GetDirectEditResultItem,
  GetDirectEditResultRequest,
  GetDirectEditResultResponse,
  SubmitDirectEditTaskAsyncRequest,
  SubmitDirectEditTaskAsyncResponse,
} from '../volcengine.interface'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { VolcengineConfig } from '../volcengine.config'
import { BaseService } from './base.service'

/**
 * Volcengine DirectEdit 服务
 * 负责视频剪辑任务
 */
@Injectable()
export class DirectEditService extends BaseService {
  constructor(config: VolcengineConfig) {
    super(config)
  }

  /**
   * 提交异步剪辑任务
   * 文档：https://www.volcengine.com/docs/4/102240
   * POST https://vod.volcengineapi.com?Action=SubmitDirectEditTaskAsync&Version=2018-01-01
   */
  async submitDirectEditTaskAsync(
    request: SubmitDirectEditTaskAsyncRequest,
  ): Promise<SubmitDirectEditTaskAsyncResponse> {
    const api = this.vodService.createAPI<
      Record<string, unknown>,
      SubmitDirectEditTaskAsyncResponse
    >('SubmitDirectEditTaskAsync', {
      Version: '2018-01-01',
      method: 'POST',
      contentType: 'json',
    })

    const spaceName = request.SpaceName || this.config.spaceName

    const requestData: Record<string, unknown> = {
      Uploader: request.Uploader || spaceName,
      Application: request.Application,
      EditParam: request.EditParam,
    }

    // Optional parameters
    if (request.Priority !== undefined) {
      requestData['Priority'] = request.Priority
    }
    if (request.CallbackUrl) {
      requestData['CallbackUrl'] = request.CallbackUrl
    }
    if (request.CallbackArgs) {
      requestData['CallbackArgs'] = request.CallbackArgs
    }

    const response = await api(requestData)

    // 检查响应中的错误
    this.checkApiResponseError(response, 'Submit direct edit task', requestData)

    return response.Result
  }

  /**
   * 处理剪辑任务查询结果
   * @param result API 返回的原始结果
   * @param reqId 请求的任务 ID
   * @returns 处理后的任务结果
   */
  private processDirectEditResult(
    result: GetDirectEditResultResponse | null | undefined,
    reqId: string,
  ): GetDirectEditResultItem {
    // 处理空结果
    if (!result) {
      this.logger.error({ reqId }, '[ProcessDirectEditResult] Result 为空')
      throw new AppException(ResponseCode.AiCallFailed, '任务结果为空')
    }

    // 如果 Result 是数组
    if (Array.isArray(result)) {
      if (result.length === 0) {
        // 任务刚提交，火山引擎还没准备好数据，返回处理中状态
        this.logger.debug({ reqId }, '[ProcessDirectEditResult] 任务结果为空数组，任务可能刚提交还在准备中')
        return {
          TaskId: reqId,
          ReqId: reqId,
          Application: 'VideoTrackToB',
          Status: 'Processing',
        }
      }

      return result[0]
    }

    // 如果 Result 是对象（某些情况下可能直接返回对象）
    if (typeof result === 'object') {
      return result as unknown as GetDirectEditResultItem
    }

    // 不支持的格式
    this.logger.error({ result, reqId }, '[ProcessDirectEditResult] Result 格式不支持')
    throw new AppException(ResponseCode.AiCallFailed, '任务结果格式错误')
  }

  /**
   * 获取剪辑任务结果
   * 文档：https://www.volcengine.com/docs/4/102242
   * GET https://vod.volcengineapi.com?Action=GetDirectEditResult&Version=2018-01-01
   */
  async getDirectEditResult(
    request: GetDirectEditResultRequest,
  ): Promise<GetDirectEditResultItem> {
    const { ReqIds } = request
    const reqId = ReqIds[0] || ''
    const api = this.vodService.createAPI<
      GetDirectEditResultRequest,
      GetDirectEditResultResponse
    >('GetDirectEditResult', {
      Version: '2018-01-01',
      method: 'POST',
      contentType: 'json',
    })

    const response = await api(request)

    this.checkApiResponseError(response, 'Get direct edit result', request)

    return this.processDirectEditResult(response.Result, reqId)
  }
}
