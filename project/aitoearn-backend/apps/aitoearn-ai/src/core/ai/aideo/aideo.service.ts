import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import {
  AiLog,
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
} from '@yikart/mongodb'
import { config } from '../../../config'
import { VolcengineVideoUtils } from '../../agent/mcp/volcengine/volcengine.utils'
import {
  AideoTaskStatus,
  AITranslationApiResponse,
  AITranslationProjectStatus,
  AITranslationSkillParams,
  ApiResponse,
  DramaRecapTaskStatus,
  EraseApiResponse,
  GetAideoTaskResultResponse,
  HighlightApiResponse,
  SkillType,
  TranslationType,
  VCreativeApiResponse,
  VCreativeStatus,
  VideoInput,
  VisionApiResponse,
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

interface BillingInfo {
  skillType: SkillType
  duration: number
  resolution?: string
  translationType?: TranslationType
}

// 视频风格转换（VCreative）分辨率系数映射
// 按短边阈值从低到高排序，查找第一个大于等于短边值的阈值
const vCreativeResolutionCoefficientMap = [
  { threshold: 480, coefficient: 0.7 }, // 480P 及以下
  { threshold: 720, coefficient: 1 }, // 720P 及以下
  { threshold: 1080, coefficient: 1.8 }, // 1080P 及以下
] as const

/**
 * Aideo 服务
 * 负责核心 Aideo 任务的提交、查询和计费
 * 视频风格转换和短剧解说委托给专门的服务
 */
@Injectable()
export class AideoService {
  private readonly logger = new Logger(AideoService.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly videoStyleTransferService: VideoStyleTransferService,
    private readonly dramaRecapService: DramaRecapService,
  ) { }

  /**
   * 计算 Aideo 任务价格
   */
  async calculateAideoPrice(billingInfo: BillingInfo): Promise<number> {
    const { skillType, duration, resolution } = billingInfo

    const durationMinutes = duration / 60

    let basePrice = 0

    switch (skillType) {
      case SkillType.VCreative: {
        basePrice = config.ai.aideo.vCreative.basePrice
        const coefficient = this.getVCreativeResolutionCoefficient(resolution)
        return durationMinutes * basePrice * coefficient
      }
      case SkillType.Vision: {
        basePrice = config.ai.aideo.vision.basePrice
        return durationMinutes * basePrice
      }
      case SkillType.Highlight: {
        basePrice = config.ai.aideo.highlight.basePrice
        return durationMinutes * basePrice
      }
      case SkillType.AITranslation: {
        // Only facial translation is supported
        basePrice = config.ai.aideo.aiTranslation.facialTranslation
        return durationMinutes * basePrice
      }
      case SkillType.Erase: {
        basePrice = config.ai.aideo.erase.basePrice
        return durationMinutes * basePrice
      }
      default:
        this.logger.warn({ skillType }, '未知的技能类型')
        return 0
    }
  }

  /**
   * 解析分辨率字符串，提取短边值
   * @param resolution 分辨率字符串，支持格式：1920x1080, 1280x720 等
   * @returns 短边值，如果无法解析则返回 null
   */
  private parseShortSide(resolution: string): number | null {
    const resolutionLower = resolution.toLowerCase().trim()
    const dimensionMatch = resolutionLower.match(/(\d+)[x×](\d+)/)

    if (dimensionMatch) {
      const width = Number.parseInt(dimensionMatch[1], 10)
      const height = Number.parseInt(dimensionMatch[2], 10)
      return Math.min(width, height)
    }

    return null
  }

  /**
   * 根据短边值查找对应的系数
   * @param shortSide 短边值
   * @param coefficientMap 系数映射表（按阈值从低到高排序）
   * @param defaultCoefficient 默认系数
   * @returns 对应的系数值
   */
  private findCoefficientByShortSide(
    shortSide: number | null,
    coefficientMap: readonly { threshold: number, coefficient: number }[],
    defaultCoefficient: number,
  ): number {
    if (shortSide === null) {
      return defaultCoefficient
    }

    // 从高到低查找第一个阈值大于等于短边值的项
    for (let i = coefficientMap.length - 1; i >= 0; i--) {
      if (shortSide <= coefficientMap[i].threshold) {
        return coefficientMap[i].coefficient
      }
    }

    // 如果短边值大于所有阈值，返回最后一个（最高）系数
    return coefficientMap[coefficientMap.length - 1].coefficient
  }

  /**
   * 获取分辨率换算系数（视频风格转换 - VCreative）
   * 按输出视频分辨率短边所属的范围进行判定（及以下）
   */
  private getVCreativeResolutionCoefficient(resolution?: string): number {
    const shortSide = resolution ? this.parseShortSide(resolution) : null
    return this.findCoefficientByShortSide(
      shortSide,
      vCreativeResolutionCoefficientMap,
      vCreativeResolutionCoefficientMap[1].coefficient, // 默认 720P
    )
  }

  /**
   * 从任务结果中提取计费信息
   */
  private async extractBillingInfo(
    taskResult: GetAideoTaskResultResponse,
  ): Promise<BillingInfo | null> {
    const { SkillType: skillType, ApiResponses } = taskResult

    if (!skillType || !ApiResponses || ApiResponses.length === 0) {
      return null
    }

    const apiResponse = ApiResponses[0] as ApiResponse

    switch (skillType) {
      case SkillType.VCreative: {
        const vCreativeResponse = apiResponse as VCreativeApiResponse
        const vCreative = vCreativeResponse.VCreative
        if (!vCreative) {
          return null
        }

        if (vCreative.Status === VCreativeStatus.Success) {
          const paramJson = vCreative.ParamJson
          const outputJson = vCreative.OutputJson
          const resolution = paramJson.resolution

          // 从 OutputJson.Result 中获取时长
          let duration = 0
          if (outputJson.Result?.Duration) {
            duration = outputJson.Result.Duration
          }
          else if (outputJson.Result?.Vid) {
            // 如果没有直接的时长，通过 VID 查询
            const mediaInfos = await this.volcengineService.getMediaInfos({
              Vids: outputJson.Result.Vid,
            })
            duration = mediaInfos.MediaInfoList?.[0].SourceInfo?.Duration ?? 0
          }
          else if (outputJson.vid) {
            // 兼容旧版本格式
            const mediaInfos = await this.volcengineService.getMediaInfos({
              Vids: outputJson.vid,
            })
            duration = mediaInfos.MediaInfoList?.[0].SourceInfo?.Duration ?? 0
          }

          return {
            skillType,
            duration,
            resolution,
          }
        }
        else {
          const paramJson = vCreative.ParamJson
          return {
            skillType,
            duration: 0,
            resolution: paramJson.resolution,
          }
        }
      }
      case SkillType.Vision: {
        const visionResponse = apiResponse as VisionApiResponse
        const duration = visionResponse.Vision?.Duration || 0
        return {
          skillType,
          duration,
        }
      }
      case SkillType.Highlight: {
        const highlightResponse = apiResponse as HighlightApiResponse
        const highlight = highlightResponse.Highlight
        return {
          skillType,
          duration: highlight?.Duration || 0,
        }
      }
      case SkillType.AITranslation: {
        const translationResponse = apiResponse as AITranslationApiResponse
        let translationType: TranslationType | undefined
        if (taskResult.SkillParams) {
          const skillParams = JSON.parse(taskResult.SkillParams) as AITranslationSkillParams
          translationType = skillParams.TranslationConfig?.TranslationTypeList?.[0]
        }
        let duration = 0
        const outputVideo = translationResponse.AITranslation?.ProjectInfo?.OutputVideo
        if (outputVideo?.DurationSecond) {
          duration = outputVideo.DurationSecond
        }
        else {
          const voiceVideo = translationResponse.AITranslation?.ProjectInfo?.VoiceTranslationVideo
          const facialVideo = translationResponse.AITranslation?.ProjectInfo?.FacialTranslationVideo
          if (voiceVideo?.DurationSecond) {
            duration = voiceVideo.DurationSecond
          }
          else if (facialVideo?.DurationSecond) {
            duration = facialVideo.DurationSecond
          }
        }
        return {
          skillType,
          duration,
          translationType,
        }
      }
      case SkillType.Erase: {
        const eraseResponse = apiResponse as EraseApiResponse
        const erase = eraseResponse.Erase
        return {
          skillType,
          duration: erase?.Output?.Task?.Erase?.Duration || 0,
        }
      }
      default:
        return null
    }
  }

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
      points: 0,
      request: params,
      status: AiLogStatus.Generating,
    })

    return {
      taskId: aiLog.id,
    }
  }

  /**
   * 处理 Aideo 任务（从火山接口获取结果并计费）
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

      if (task.points && task.points > 0) {
        await this.updateTaskResult(task, taskResult, true)
        return
      }

      const billingInfo = await this.extractBillingInfo(taskResult)
      this.logger.debug({ billingInfo }, '提取计费信息完成')
      if (!billingInfo || billingInfo.duration <= 0) {
        this.logger.warn(
          { taskId: task.id, taskResult },
          '无法提取计费信息或时长为 0',
        )
        await this.updateTaskResult(task, taskResult, false)
        return
      }

      const price = await this.calculateAideoPrice(billingInfo)
      this.logger.debug({ taskId: task.id, price }, '计算任务价格完成')
      if (price > 0 && task.userType === UserType.User) {
        await this.creditsHelper.deductCredits({
          userId: task.userId,
          amount: price,
          type: CreditsType.AiService,
          description: `Aideo ${billingInfo.skillType}`,
        })
      }

      await this.updateTaskResult(task, taskResult, true, price)
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
    isBilled: boolean,
    price?: number,
  ) {
    if (taskResult.ApiResponses && taskResult.ApiResponses.length > 0) {
      const apiResponse = taskResult.ApiResponses[0] as ApiResponse
      await this.saveOutputVideos(apiResponse, task)
    }

    await this.aiLogRepo.updateById(task.id, {
      status: AiLogStatus.Success,
      response: taskResult,
      points: isBilled && price !== undefined ? price : task.points,
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
      const response = aiLog.response

      return {
        taskId: aiLog.id,
        model: aiLog.model,
        status: aiLog.status === AiLogStatus.Success
          ? AideoTaskStatus.Completed
          : aiLog.status === AiLogStatus.Failed
            ? AideoTaskStatus.Failed
            : AideoTaskStatus.Processing,
        outputVid: response?.['outputVid'],
        outputUrl: response?.['outputUrl'],
        errorMessage: aiLog.errorMessage,
        createdAt: aiLog.startedAt,
        updatedAt: aiLog.updatedAt || aiLog.startedAt,
      }
    }

    // 处理通用 Aideo 任务
    const response = aiLog.response as GetAideoTaskResultResponse | undefined
    const error = response?.ApiResponses?.[0]?.Error

    return {
      taskId: aiLog.id,
      model: aiLog.model,
      status: response?.Status || (aiLog.status === AiLogStatus.Success
        ? AideoTaskStatus.Completed
        : aiLog.status === AiLogStatus.Failed
          ? AideoTaskStatus.Failed
          : AideoTaskStatus.Processing),
      skillType: response?.SkillType,
      skillParams: response?.SkillParams,
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
