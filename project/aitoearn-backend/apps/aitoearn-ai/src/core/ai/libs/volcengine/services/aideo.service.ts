import type {
  GetAideoTaskResultRequest,
  GetAideoTaskResultResponse,
  MultiInput,
  SkillParams,
  SubmitAideoTaskAsyncRequest,
  SubmitAideoTaskAsyncResponse,
  VideoInput,
  VideoStreamInput,
  VideoUrlInput,
} from '../volcengine.interface'
import { Injectable } from '@nestjs/common'
import { VolcengineConfig } from '../volcengine.config'
import {
  SkillType,
  VCreativeOutputJsonSuccess,
  VCreativeParamJson,
  VCreativeResult,
  VCreativeStatus,
} from '../volcengine.interface'
import { BaseService } from './base.service'
import { UploadService } from './upload.service'

/**
 * Volcengine Aideo 服务
 * 负责智能视频处理任务：提交、查询
 */
@Injectable()
export class AideoService extends BaseService {
  constructor(
    config: VolcengineConfig,
    private readonly uploadService: UploadService,
  ) {
    super(config)
  }

  /**
   * 提交异步智能视频处理任务
   * POST https://vod.volcengineapi.com?Action=SubmitAideoTaskAsync&Version=2025-03-03
   * 支持两种调用方式（类型系统保证互斥）：
   * 1. 自然语言驱动：使用 Prompt 参数
   * 2. 指定技能驱动：使用 SkillType + SkillParams 参数
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
        /** 技能参数对象（会自动序列化为 JSON 字符串） */
        SkillParams?: SkillParams
      },
  ): Promise<SubmitAideoTaskAsyncResponse> {
    const api = this.vodService.createAPI<
      SubmitAideoTaskAsyncRequest,
      SubmitAideoTaskAsyncResponse
    >('SubmitAideoTaskAsync', {
      Version: '2025-03-03',
      method: 'POST',
      contentType: 'json',
    })

    // 准备请求数据（根据类型系统保证的互斥性构建）
    let requestData: SubmitAideoTaskAsyncRequest

    if ('Prompt' in request) {
      // 自然语言驱动
      requestData = {
        SpaceName: request.SpaceName || this.config.spaceName,
        MultiInputs: request.MultiInputs,
        Prompt: request.Prompt,
      }
    }
    else {
      // 指定技能驱动
      requestData = {
        SpaceName: request.SpaceName || this.config.spaceName,
        MultiInputs: request.MultiInputs,
        SkillType: request.SkillType,
        ...(request.SkillParams && {
          SkillParams: JSON.stringify(request.SkillParams),
        }),
      }
    }

    // 调用 API
    const response = await api(requestData)

    // 调试：记录火山引擎提交任务的原始响应
    this.logger.debug({
      hasResult: !!response.Result,
      taskId: response.Result?.TaskId,
      requestId: response.ResponseMetadata?.RequestId,
      spaceName: requestData.SpaceName,
    }, '火山引擎Aideo任务提交API响应')

    // 简洁日志，便于快速排查（单行、易搜索）
    this.logger.debug({
      taskId: response.Result?.TaskId,
      requestId: response.ResponseMetadata?.RequestId,
      spaceName: requestData.SpaceName,
      skillType: 'SkillType' in requestData ? requestData.SkillType : undefined,
      inputVids: (requestData.MultiInputs || []).map(i => i.Vid).filter(Boolean),
    }, 'VOLCENGINE Submit summary')

    // 检查响应中的错误
    this.checkApiResponseError(response, 'Aideo task submission', requestData)

    return response.Result
  }

  /**
   * 获取异步智能视频处理任务结果
   * Get https://vod.volcengineapi.com?Action=GetAideoTaskResult&Version=2025-03-03
   */
  async getAideoTaskResult(
    request: GetAideoTaskResultRequest,
  ): Promise<GetAideoTaskResultResponse> {
    const api = this.vodService.createAPI<
      GetAideoTaskResultRequest,
      GetAideoTaskResultResponse
    >('GetAideoTaskResult', {
      Version: '2025-03-03',
      method: 'GET',
      contentType: 'json',
    })

    const requestData: GetAideoTaskResultRequest = {
      ...request,
      SpaceName: request.SpaceName || this.config.spaceName,
    }

    const response = await api(requestData)

    // 检查响应中的错误
    this.checkApiResponseError(response, 'Get Aideo task result', requestData)

    const result = response.Result

    // 解析 VCreative 的 ParamJson 和 OutputJson
    if (result.ApiResponses) {
      for (const apiResponse of result.ApiResponses) {
        if (apiResponse.VodTaskType === SkillType.VCreative && apiResponse.VCreative) {
          const vCreative = apiResponse.VCreative
          try {
            const paramJsonStr = typeof vCreative.ParamJson === 'string' ? vCreative.ParamJson : JSON.stringify(vCreative.ParamJson)
            const paramJson = JSON.parse(paramJsonStr) as VCreativeParamJson
            if (vCreative.Status === VCreativeStatus.Success) {
              const outputJsonStr = typeof vCreative.OutputJson === 'string' ? vCreative.OutputJson : JSON.stringify(vCreative.OutputJson)
              const outputJson = JSON.parse(outputJsonStr) as VCreativeOutputJsonSuccess
              apiResponse.VCreative = {
                ...vCreative,
                Status: VCreativeStatus.Success,
                ParamJson: paramJson,
                OutputJson: outputJson,
              } as VCreativeResult
            }
            else {
              apiResponse.VCreative = {
                ...vCreative,
                ParamJson: paramJson,
              } as VCreativeResult
            }
          }
          catch (error) {
            this.logger.warn({ error, vCreative }, '解析 VCreative ParamJson 或 OutputJson 失败')
          }
        }
      }
    }

    return result
  }

  /**
   * 智能视频上传并提交异步智能视频处理任务
   * 自动处理视频 URL 或文件流上传，获取 vid 后调用 submitAideoTaskAsync
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
    const urlInputs: Array<{ url: string, options?: VideoUrlInput, index: number }> = []
    const streamInputs: Array<{ input: VideoStreamInput, index: number }> = []

    request.MultiInputs.forEach((input, index) => {
      if (typeof input === 'string') {
        urlInputs.push({ url: input, index })
      }
      else if ('type' in input) {
        if (input.type === 'url') {
          urlInputs.push({ url: input.url, options: input, index })
        }
        else if (input.type === 'stream') {
          streamInputs.push({ input, index })
        }
      }
    })

    const urlVids = urlInputs.length > 0
      ? await this.uploadService.batchUploadUrlsAndGetVids(urlInputs)
      : []

    const streamVids = streamInputs.length > 0
      ? await Promise.all(
          streamInputs.map(({ input }) => this.uploadService.uploadStreamAndGetVid(input)),
        )
      : []

    const allVids: string[] = Array.from({ length: request.MultiInputs.length })
    urlInputs.forEach(({ index }, i) => {
      allVids[index] = urlVids[i]
    })
    streamInputs.forEach(({ index }, i) => {
      allVids[index] = streamVids[i]
    })

    const multiInputs: MultiInput[] = allVids.map(vid => ({
      Type: 'Vid',
      Vid: vid,
    }))

    const result = await this.submitAideoTaskAsync({
      ...request,
      MultiInputs: multiInputs,
    } as Parameters<typeof this.submitAideoTaskAsync>[0])

    return {
      ...result,
      vids: allVids,
    }
  }
}
