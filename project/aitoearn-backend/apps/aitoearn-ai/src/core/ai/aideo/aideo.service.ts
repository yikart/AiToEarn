import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, ResponseCode } from '@yikart/common'
import {
  AideoAiLogResponse,
  AiLog,
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
  StyleTransferAiLogResponse,
} from '@yikart/mongodb'
import { VolcengineVideoUtils } from '../../agent/mcp/volcengine/volcengine.utils'
import {
  AideoTaskStatus,
  AITranslationApiResponse,
  AITranslationProjectStatus,
  ApiResponse,
  DramaRecapTaskStatus,
  EraseApiResponse,
  GetAideoTaskResultResponse,
  HighlightApiResponse,
  SkillType,
  VCreativeApiResponse,
  VCreativeStatus,
  VideoInput,
  VolcengineService,
} from '../libs/volcengine'
import { parseVolcengineError } from '../libs/volcengine/volcengine.utils'
import {
  UserGetAideoTaskQueryDto,
  UserGetDramaRecapTaskRequest,
  UserGetVideoStyleTransferTaskRequest,
  UserListAideoTasksQueryDto,
  UserSubmitAideoTaskRequest,
  UserSubmitDramaRecapTaskRequest,
  UserSubmitVideoStyleTransferRequest,
} from './aideo.dto'
import { DramaRecapService } from './drama-recap.service'
import { VideoStyleTransferService } from './video-style-transfer.service'

/**
 * Aideo 服务
 * 负责核心 Aideo 任务的提交和查询
 * 视频风格转换和短剧解说委托给专门的服务
 */
@Injectable()
export class AideoService {
  private readonly logger = new Logger(AideoService.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly videoStyleTransferService: VideoStyleTransferService,
    private readonly dramaRecapService: DramaRecapService,
  ) { }

  /**
   * 提交 Aideo 任务
   */
  async submitAideoTask(request: UserSubmitAideoTaskRequest) {
    const { userId, userType, ...params } = request

    const startedAt = new Date()

    const videoInputs: VideoInput[] = params.multiInputs.map((input): VideoInput => {
      if (typeof input === 'string') {
        return input
      }
      if (input.type === 'url') {
        return this.assetsService.buildUrl(input.url)
      }

      return {
        type: 'stream',
        stream: input.stream,
        fileSize: input.fileSize,
        fileName: input.fileName,
        fileExtension: input.fileExtension,
      }
    })

    this.logger.debug({ inputCount: videoInputs.length }, '视频输入处理完成')

    let taskResult
    if ('prompt' in params) {
      taskResult = await this.volcengineService.submitAideoTaskAsyncWithUpload({
        SpaceName: params.spaceName,
        MultiInputs: videoInputs,
        Prompt: params.prompt,
      })
    }
    else {
      taskResult = await this.volcengineService.submitAideoTaskAsyncWithUpload({
        SpaceName: params.spaceName,
        MultiInputs: videoInputs,
        SkillType: params.skillType,
        SkillParams: params.skillParams,
      })
    }

    this.logger.debug({
      taskId: taskResult.TaskId,
      spaceName: params.spaceName,
      inputVidsCount: videoInputs.length,
      inputVids: videoInputs.map(v => (typeof v === 'string' ? v : v.type === 'stream' ? 'stream' : v.url)).filter(Boolean).slice(0, 5),
    }, 'VOLCENGINE Submit summary')

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: taskResult.TaskId,
      model: 'aideo',
      channel: AiLogChannel.Volcengine,
      startedAt,
      type: AiLogType.Aideo,
      request: params,
      status: AiLogStatus.Generating,
    })

    return {
      taskId: aiLog.id,
    }
  }

  /**
   * 处理 Aideo 任务（从火山接口获取结果）
   * 支持多种任务类型：
   * - 'aideo': 通用 Aideo 任务（使用 GetAideoTaskResult API）
   * - 'video-style-transfer': 视频风格转换任务（委托给 VideoStyleTransferService）
   * - 'drama-recap': 短剧解说任务（委托给 DramaRecapService）
   */
  async processAideoTask(task: AiLog) {
    const taskId = task.taskId
    if (!taskId) {
      this.logger.warn({ taskId: task.id }, '任务缺少 taskId，跳过处理')
      return
    }

    if (task.model === 'video-style-transfer') {
      return this.videoStyleTransferService.processVCreativeTask(task)
    }

    if (task.model === 'drama-recap') {
      this.logger.log({ taskId: task.id, volcengineTaskId: taskId }, '[DramaRecap] 定时任务查询状态')

      const result = await this.volcengineService.getDramaRecapTask({
        TaskId: taskId,
        SpaceName: this.volcengineService.getSpaceName(),
      })

      this.logger.log({ taskId: task.id, status: result.Status }, '[DramaRecap] 查询结果')
      if (result.Status === DramaRecapTaskStatus.Completed || result.Status === DramaRecapTaskStatus.Failed) {
        await this.dramaRecapService.processDramaRecapTask(task, result)
      }
      return
    }

    const taskResult = await this.volcengineService.getAideoTaskResult({
      TaskId: taskId,
    })

    const { Status } = taskResult

    if (Status === AideoTaskStatus.Completed) {
      // 检查是否有有效的API响应
      if (!taskResult.ApiResponses || taskResult.ApiResponses.length === 0) {
        this.logger.error(
          { taskId: task.id, taskResult },
          '任务完成但没有API响应，可能是火山引擎处理失败',
        )
        await this.aiLogRepo.updateById(task.id, {
          status: AiLogStatus.Failed,
          response: taskResult,
          errorMessage: '任务完成但没有有效的输出结果，可能是火山引擎处理失败',
        })
        return
      }

      const apiResponse = taskResult.ApiResponses[0] as ApiResponse

      if (apiResponse.Error) {
        const errorMessage = apiResponse.Error.Message || '任务执行失败'

        this.logger.error({
          taskId: task.id,
          errorCode: apiResponse.Error.Code,
          errorMessage,
          vodTaskType: apiResponse.VodTaskType,
        }, 'API 响应包含错误，任务失败')

        await this.aiLogRepo.updateById(task.id, {
          status: AiLogStatus.Failed,
          response: taskResult,
          errorMessage,
        })
        return
      }

      // 额外验证：对于 AITranslation，确保 ProjectInfo 状态与输出资产已就绪
      if (apiResponse.VodTaskType === SkillType.AITranslation) {
        const translationResponse = apiResponse as AITranslationApiResponse
        const projectInfo = translationResponse.AITranslation?.ProjectInfo
        const projectStatus = projectInfo?.Status

        const hasAsset = Boolean(
          projectInfo?.OutputVideo?.Url || projectInfo?.OutputVideo?.Vid || projectInfo?.OutputVideo?.FileName
          || projectInfo?.FacialTranslationVideo?.Url || projectInfo?.FacialTranslationVideo?.Vid || projectInfo?.FacialTranslationVideo?.FileName
          || projectInfo?.VoiceTranslationVideo?.Url || projectInfo?.VoiceTranslationVideo?.Vid || projectInfo?.VoiceTranslationVideo?.FileName,
        )

        const exportingOrProcessingStatuses = new Set([
          AITranslationProjectStatus.InProcessing,
          AITranslationProjectStatus.ProcessSuspended,
          AITranslationProjectStatus.InExporting,
        ])

        if (!hasAsset || (projectStatus && exportingOrProcessingStatuses.has(projectStatus))) {
          const elapsed = Date.now() - task.startedAt.getTime()

          this.logger.warn({ taskId: task.id, elapsed, projectStatus, hasAsset }, 'AITranslation 标记为 Completed 但未产出可用资产，延迟处理')

          await this.aiLogRepo.updateById(task.id, { status: AiLogStatus.Generating, response: taskResult })
          return
        }
      }

      // 额外验证：对于 VCreative，检查内部状态是否成功
      if (apiResponse.VodTaskType === SkillType.VCreative) {
        const vCreativeResponse = apiResponse as VCreativeApiResponse
        const vCreative = vCreativeResponse.VCreative

        if (vCreative && vCreative.Status !== VCreativeStatus.Success) {
          const errorMessage = typeof vCreative.OutputJson === 'string'
            ? vCreative.OutputJson
            : (vCreativeResponse.Error?.Message || `VCreative 任务失败: ${vCreative.Status}`)

          this.logger.error({
            taskId: task.id,
            vCreativeStatus: vCreative.Status,
            errorMessage,
          }, 'VCreative 任务内部状态失败')

          await this.aiLogRepo.updateById(task.id, {
            status: AiLogStatus.Failed,
            response: taskResult,
            errorMessage,
          })
          return
        }
      }

      await this.updateTaskResult(task, taskResult)
    }
    else if (Status === AideoTaskStatus.Failed) {
      const apiError = taskResult.ApiResponses?.[0]?.Error
      const errorMessage = apiError?.Message || '任务失败'
      const errorCode = apiError?.Code

      // 解析错误并提供友好提示
      let enhancedErrorMessage = errorMessage
      if (errorCode) {
        const parsedError = parseVolcengineError(errorCode, errorMessage)
        enhancedErrorMessage = `${parsedError.userMessage}\n技术详情: ${parsedError.technicalDetails}\n建议: ${parsedError.suggestions.join('; ')}`

        this.logger.error({
          taskId: task.id,
          errorCode,
          userMessage: parsedError.userMessage,
          suggestions: parsedError.suggestions,
        }, '任务失败')
      }

      await this.aiLogRepo.updateById(task.id, {
        status: AiLogStatus.Failed,
        response: taskResult,
        errorMessage: enhancedErrorMessage,
      })
    }
    else if (Status === AideoTaskStatus.Processing) {
      await this.aiLogRepo.updateById(task.id, {
        status: AiLogStatus.Generating,
        response: taskResult,
      })
    }
  }

  /**
   * 更新任务结果
   */
  private async updateTaskResult(
    task: AiLog,
    taskResult: GetAideoTaskResultResponse,
  ) {
    if (taskResult.ApiResponses && taskResult.ApiResponses.length > 0) {
      const apiResponse = taskResult.ApiResponses[0] as ApiResponse
      await this.saveOutputVideos(apiResponse, task)
    }

    await this.aiLogRepo.updateById(task.id, {
      status: AiLogStatus.Success,
      response: taskResult,
      duration: Date.now() - task.startedAt.getTime(),
    })
  }

  /**
   * 从 VID 获取视频并上传
   * @param vid 视频 ID
   * @param task 任务日志
   * @param filenamePrefix 文件名前缀
   * @returns URL，如果失败则返回 undefined
   */
  private async saveVideoFromVid(
    vid: string,
    task: AiLog,
    filenamePrefix: string,
  ): Promise<string | undefined> {
    return VolcengineVideoUtils.saveVideoFromVid(
      vid,
      task.userId,
      `${task.id}-${filenamePrefix}`,
      task.model || 'aideo',
      this.volcengineService,
      this.assetsService,
      this.logger,
      AssetType.AideoOutput,
    )
  }

  /**
   * 保存输出视频
   */
  private async saveOutputVideos(apiResponse: ApiResponse, task: AiLog) {
    if (apiResponse.VodTaskType === SkillType.AITranslation) {
      const translationResponse = apiResponse as AITranslationApiResponse
      const projectInfo = translationResponse.AITranslation?.ProjectInfo
      if (projectInfo?.OutputVideo?.Url) {
        const result = await this.assetsService.uploadFromUrl(task.userId, {
          url: projectInfo.OutputVideo.Url,
          type: AssetType.AideoOutput,
        }, task.model || 'aideo')
        if (result && projectInfo.OutputVideo) {
          projectInfo.OutputVideo.Url = this.assetsService.buildUrl(result.asset.path)
        }
      }
    }
    else if (apiResponse.VodTaskType === SkillType.Erase) {
      const eraseResponse = apiResponse as EraseApiResponse
      const erase = eraseResponse.Erase
      const file = erase?.Output?.Task?.Erase?.File

      if (file?.FileName) {
        const outputUrl = await VolcengineVideoUtils.saveVideoFromFileName(
          file.FileName,
          task.userId,
          `${task.id}-erase`,
          task.model || 'aideo',
          this.assetsService,
          this.logger,
          AssetType.AideoOutput,
        )
        if (outputUrl && file) {
          file.url = outputUrl
        }
      }
    }
    else if (apiResponse.VodTaskType === SkillType.Highlight) {
      const highlightResponse = apiResponse as HighlightApiResponse
      const highlight = highlightResponse.Highlight
      if (highlight?.Edits) {
        for (const edit of highlight.Edits) {
          if (edit.Vid) {
            const outputUrl = await this.saveVideoFromVid(edit.Vid, task, 'highlight')
            if (outputUrl) {
              edit.url = outputUrl
            }
          }
        }
      }
    }
    else if (apiResponse.VodTaskType === SkillType.VCreative) {
      const vCreativeResponse = apiResponse as VCreativeApiResponse
      const vCreative = vCreativeResponse.VCreative
      if (!vCreative) {
        return
      }

      if (vCreative.Status === VCreativeStatus.Success) {
        const outputJson = vCreative.OutputJson
        // 支持新版本和旧版本的数据结构
        const vid = outputJson.Result?.Vid || outputJson.vid
        if (vid) {
          const outputUrl = await this.saveVideoFromVid(vid, task, 'vcreative')

          if (outputUrl) {
            if (outputJson.Result) {
              outputJson.Result.url = outputUrl
            }
            else {
              outputJson.url = outputUrl
            }
            this.logger.debug({ outputUrl }, '[VCreative] 视频已保存')
          }
          else {
            this.logger.error({ vid }, '[VCreative] 视频保存失败')
          }
        }
        else {
          this.logger.warn({ outputJson }, '[VCreative] 无法从 outputJson 中提取 VID')
        }
      }
    }
  }

  /**
   * 查询 Aideo 任务状态
   */
  async getAideoTask(request: UserGetAideoTaskQueryDto) {
    const { userId, userType, taskId } = request

    const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)

    if (!aiLog || aiLog.type !== AiLogType.Aideo || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    return this.transformToResponseVo(aiLog)
  }

  /**
   * 列表查询 Aideo 任务
   */
  async listAideoTasks(request: UserListAideoTasksQueryDto) {
    const { userId, userType, ...pagination } = request

    const [aiLogs, total] = await this.aiLogRepo.listWithPagination({
      ...pagination,
      userId,
      userType,
      type: AiLogType.Aideo,
      channel: AiLogChannel.Volcengine,
    })

    return [
      await Promise.all(aiLogs.map(log => this.transformToResponseVo(log))),
      total,
    ] as const
  }

  /**
   * 转换为响应 VO
   * 支持两种任务类型：
   * 1. 通用 Aideo 任务（model: 'aideo'）
   * 2. 视频风格转换任务（model: 'video-style-transfer'）
   */
  private transformToResponseVo(aiLog: AiLog) {
    // 处理视频风格转换任务
    if (aiLog.model === 'video-style-transfer') {
      const response = aiLog.response as StyleTransferAiLogResponse | undefined

      return {
        taskId: aiLog.id,
        model: aiLog.model,
        status: aiLog.status === AiLogStatus.Success
          ? AideoTaskStatus.Completed
          : aiLog.status === AiLogStatus.Failed
            ? AideoTaskStatus.Failed
            : AideoTaskStatus.Processing,
        outputVid: response?.outputVid,
        outputUrl: response?.outputUrl,
        errorMessage: aiLog.errorMessage,
        createdAt: aiLog.startedAt,
        updatedAt: aiLog.updatedAt || aiLog.startedAt,
      }
    }

    // 处理通用 Aideo 任务
    const response = aiLog.response as AideoAiLogResponse | undefined
    const error = response?.ApiResponses?.[0]?.Error
    const status = response?.Status && Object.values(AideoTaskStatus).includes(response.Status as AideoTaskStatus)
      ? response.Status as AideoTaskStatus
      : aiLog.status === AiLogStatus.Success
        ? AideoTaskStatus.Completed
        : aiLog.status === AiLogStatus.Failed
          ? AideoTaskStatus.Failed
          : AideoTaskStatus.Processing
    const skillType = response?.SkillType && Object.values(SkillType).includes(response.SkillType as SkillType)
      ? response.SkillType as SkillType
      : undefined

    return {
      taskId: aiLog.id,
      model: aiLog.model,
      status,
      skillType,
      skillParams: response?.SkillParams ? JSON.stringify(response.SkillParams) : undefined,
      apiResponses: response?.ApiResponses,
      error: error ? { code: error.Code, message: error.Message } : undefined,
      errorMessage: aiLog.errorMessage,
      createdAt: aiLog.startedAt,
      updatedAt: aiLog.updatedAt || aiLog.startedAt,
    }
  }

  // ========== 委托方法（保持向后兼容） ==========

  /**
   * 提交视频风格转换任务
   * @deprecated 直接使用 VideoStyleTransferService.submitVideoStyleTransferTask
   */
  async submitVideoStyleTransferTask(
    request: UserSubmitVideoStyleTransferRequest,
  ): Promise<{ taskId: string }> {
    return this.videoStyleTransferService.submitVideoStyleTransferTask(request)
  }

  /**
   * 获取视频风格转换任务结果
   * @deprecated 直接使用 VideoStyleTransferService.getVideoStyleTransferTask
   */
  async getVideoStyleTransferTask(
    request: UserGetVideoStyleTransferTaskRequest,
  ) {
    return this.videoStyleTransferService.getVideoStyleTransferTask(request)
  }

  /**
   * 提交短剧解说任务
   * @deprecated 直接使用 DramaRecapService.submitDramaRecapTask
   */
  async submitDramaRecapTask(
    request: UserSubmitDramaRecapTaskRequest,
  ): Promise<{ taskId: string, dramaScriptTaskId: string }> {
    return this.dramaRecapService.submitDramaRecapTask(request)
  }

  /**
   * 获取短剧解说任务结果
   * @deprecated 直接使用 DramaRecapService.getDramaRecapTask
   */
  async getDramaRecapTask(
    request: UserGetDramaRecapTaskRequest,
  ): Promise<{
    taskId: string
    status: DramaRecapTaskStatus
    outputVid?: string
    outputUrl?: string
    errorMessage?: string
  }> {
    return this.dramaRecapService.getDramaRecapTask(request)
  }
}
