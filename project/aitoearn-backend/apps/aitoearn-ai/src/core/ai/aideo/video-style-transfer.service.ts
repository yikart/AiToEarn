import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, getErrorMessage, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import {
  AiLog,
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
} from '@yikart/mongodb'
import { isAxiosError } from 'axios'
import { config } from '../../../config'
import { VolcengineVideoUtils } from '../../agent/mcp/volcengine/volcengine.utils'
import {
  AsyncVCreativeTaskParamObj,
  GetVCreativeTaskResultResponse,
  VCreativeTaskStatus,
  VolcengineService,
} from '../libs/volcengine'
import { UserGetVideoStyleTransferTaskRequest, UserSubmitVideoStyleTransferRequest } from './aideo.dto'

// 视频风格转换（VCreative）分辨率系数映射
// 按短边阈值从低到高排序，查找第一个大于等于短边值的阈值
const vCreativeResolutionCoefficientMap = [
  { threshold: 480, coefficient: 0.7 }, // 480P 及以下
  { threshold: 720, coefficient: 1 }, // 720P 及以下
  { threshold: 1080, coefficient: 1.8 }, // 1080P 及以下
] as const

/**
 * 视频风格转换服务
 * 负责 VCreative 视频风格转换任务的提交、查询和计费
 */
@Injectable()
export class VideoStyleTransferService {
  private readonly logger = new Logger(VideoStyleTransferService.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly creditsHelper: CreditsHelperService,
  ) { }

  /**
   * 提交视频风格转换任务（使用 AsyncVCreativeTask API）
   */
  async submitVideoStyleTransferTask(
    request: UserSubmitVideoStyleTransferRequest,
  ): Promise<{ taskId: string }> {
    const { userId, userType, videoInput, style, resolution } = request

    this.logger.debug({ userId, videoInput, style, originalStyle: style, resolution }, '[VideoStyleTransfer] 提交任务')
    const startedAt = new Date()

    // 1. 处理输入视频
    let vid: string
    if (videoInput.startsWith('vid://')) {
      vid = videoInput.replace('vid://', '')
      this.logger.debug({ vid }, '[VideoStyleTransfer] 使用已有 VID')
    }
    else if (videoInput.startsWith('http://') || videoInput.startsWith('https://')) {
      // 优先使用流上传（更快更可靠）
      this.logger.debug({ url: videoInput }, '[VideoStyleTransfer] 开始下载并上传视频')

      vid = await this.volcengineService.downloadUrlAndUploadAsStream(
        videoInput,
      )
      this.logger.log({ vid }, '[VideoStyleTransfer] 视频上传成功')
    }
    else {
      // 假设直接传入的就是 VID
      vid = videoInput
    }

    const paramObj: AsyncVCreativeTaskParamObj = {
      input: vid.startsWith('vid://') ? vid : `vid://${vid}`,
      space_name: this.volcengineService.getSpaceName(),
      style,
      resolution,
    }

    const response = await this.volcengineService.asyncVCreativeTask({
      Scene: 'videostyletrans',
      Uploader: this.volcengineService.getSpaceName(),
      ParamObj: paramObj,
    })

    const taskId = response.VCreativeId

    this.logger.debug({ taskId }, '[VideoStyleTransfer] 任务提交成功')

    await this.aiLogRepo.create({
      userId,
      userType: userType as UserType,
      taskId,
      model: 'video-style-transfer',
      channel: AiLogChannel.StyleTransfer,
      startedAt,
      type: AiLogType.StyleTransfer,
      points: 0,
      request: { videoInput, style, resolution, vid },
      response: { taskId },
      status: AiLogStatus.Generating,
    })

    return { taskId }
  }

  /**
   * 获取视频风格转换任务结果（用户主动查询接口）
   * 注意：定时任务会自动处理任务状态，此方法主要用于用户主动查询
   */
  async getVideoStyleTransferTask(
    request: UserGetVideoStyleTransferTaskRequest,
  ): Promise<{
    taskId: string
    status: 'Processing' | 'Completed' | 'Failed'
    outputVid?: string
    outputUrl?: string
    errorMessage?: string
  }> {
    const { taskId } = request

    this.logger.debug({ taskId }, '[VideoStyleTransfer] 查询任务状态')

    // 从数据库查询任务记录
    const log = await this.aiLogRepo.getByTaskId(taskId)

    if (!log) {
      throw new AppException(ResponseCode.AiLogNotFound)
    }

    // 如果任务已完成或失败，直接返回数据库中的结果
    if (log.status === AiLogStatus.Success) {
      const response = log.response
      return {
        taskId,
        status: 'Completed',
        outputVid: response?.['outputVid'],
        outputUrl: response?.['outputUrl'],
      }
    }

    if (log.status === AiLogStatus.Failed) {
      return {
        taskId,
        status: 'Failed',
        errorMessage: log.errorMessage || '任务执行失败',
      }
    }

    const result: GetVCreativeTaskResultResponse = await this.volcengineService.getVCreativeTaskResult({
      VCreativeId: taskId,
    })

    // 如果任务已完成，触发处理逻辑
    if (result.Status === VCreativeTaskStatus.Success || result.Status === VCreativeTaskStatus.FailedRun) {
      // 调用 processVCreativeTask 处理任务（更新数据库、下载视频、扣费等）
      await this.processVCreativeTask(log)

      // 重新查询数据库获取最新状态
      const updatedLog = await this.aiLogRepo.getById(log.id)
      if (updatedLog) {
        const response = updatedLog.response
        return {
          taskId,
          status: updatedLog.status === AiLogStatus.Success ? 'Completed' : 'Failed',
          outputVid: response?.['outputVid'],
          outputUrl: response?.['outputUrl'],
          errorMessage: updatedLog.errorMessage,
        }
      }
    }

    return {
      taskId,
      status: 'Processing',
    }
  }

  /**
   * 处理 VCreative 任务（视频风格转换）
   * 从火山引擎获取结果并计费
   */
  async processVCreativeTask(task: AiLog) {
    const taskId = task.taskId
    if (!taskId) {
      this.logger.warn({ taskId: task.id }, 'VCreative 任务缺少 taskId，跳过处理')
      return
    }

    try {
      const result: GetVCreativeTaskResultResponse = await this.volcengineService.getVCreativeTaskResult({
        VCreativeId: taskId,
      })

      this.logger.debug({ taskId: task.id, status: result.Status }, 'VCreative 任务状态')

      // 处理成功状态
      if (result.Status === VCreativeTaskStatus.Success) {
        // 解析输出 VID
        let outputVid: string | undefined
        if (result.OutputJson) {
          try {
            const outputJson = JSON.parse(result.OutputJson)
            outputVid = outputJson.vid
          }
          catch (error) {
            this.logger.warn({ error }, '[VCreative] 解析 OutputJson 失败')
          }
        }

        // 下载视频并上传到 S3
        let s3Url: string | undefined
        if (outputVid) {
          try {
            this.logger.debug({ outputVid }, '[VCreative] 开始下载视频并上传到 S3')
            s3Url = await this.saveVideoFromVid(outputVid, task, 'video-style-transfer')
            this.logger.debug({ s3Url }, '[VCreative] 视频已上传到 S3')
          }
          catch (error) {
            this.logger.error({ error }, '[VCreative] 下载或上传 S3 失败')
          }
        }

        // 计算费用并扣费（只对已登录用户扣费）
        if (task.userType === UserType.User) {
          await this.calculateVideoStyleTransferPoints(
            task.userId,
            task.userType as UserType,
            taskId,
            result,
          )
        }

        // 更新任务状态为成功
        await this.aiLogRepo.updateById(task.id, {
          status: AiLogStatus.Success,
          response: {
            ...result,
            outputVid,
            outputUrl: s3Url,
          },
          duration: Date.now() - task.startedAt.getTime(),
        })

        this.logger.debug({ taskId: task.id, outputVid, s3Url }, '[VCreative] 任务处理完成')
      }
      // 处理失败状态
      else if (result.Status === VCreativeTaskStatus.FailedRun) {
        const errorMessage = result.OutputJson || '任务执行失败'

        this.logger.error({ taskId: task.id, errorMessage }, '[VCreative] 任务失败')

        await this.aiLogRepo.updateById(task.id, {
          status: AiLogStatus.Failed,
          response: result,
          errorMessage,
        })
      }
      // 处理中状态 - 不做任何操作，等待下次轮询
      else if (result.Status === VCreativeTaskStatus.Processing) {
        this.logger.debug({ taskId: task.id }, '[VCreative] 任务处理中')
        // 不更新数据库，保持 Generating 状态
      }
    }
    catch (error) {
      this.logger.error({ error, taskId: task.id, volcengineTaskId: taskId }, '获取 VCreative 任务结果失败')

      const resp = isAxiosError(error)
        ? (error.response?.data ?? error.response)
        : undefined

      await this.aiLogRepo.updateById(task.id, {
        status: AiLogStatus.Failed,
        response: resp ? (typeof resp === 'object' ? resp : { message: String(resp) }) : undefined,
        errorMessage: getErrorMessage(error),
      })
    }
  }

  /**
   * 计算视频风格转换费用并扣费
   */
  private async calculateVideoStyleTransferPoints(
    userId: string,
    userType: UserType,
    taskId: string,
    result: GetVCreativeTaskResultResponse,
  ): Promise<void> {
    let duration = 0
    if (result.OutputJson) {
      const outputJson = JSON.parse(result.OutputJson)
      const outputVid = outputJson.vid

      if (outputVid) {
        const mediaInfos = await this.volcengineService.getMediaInfos({
          Vids: outputVid,
        })
        duration = mediaInfos.MediaInfoList?.[0]?.SourceInfo?.Duration ?? 0
      }
    }

    // 获取分辨率（从任务参数中）
    const log = await this.aiLogRepo.getByTaskId(taskId)
    const requestData = log?.request
    const resolution = requestData?.['resolution'] as string || '720p'

    // 计算价格
    const basePrice = config.ai.aideo.vCreative.basePrice // 元/分钟
    const coefficient = this.getVCreativeResolutionCoefficient(resolution)
    const durationMinutes = duration / 60
    const totalPrice = durationMinutes * basePrice * coefficient

    this.logger.debug({
      taskId,
      duration,
      resolution,
      basePrice,
      coefficient,
      totalPrice,
    }, '[VideoStyleTransfer] 计算费用')

    // 扣费
    if (totalPrice > 0) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: totalPrice,
        type: CreditsType.VideoStyleTransfer,
        description: `video style transfer - task ID: ${taskId}`,
        metadata: { taskId, duration, resolution },
      })
    }

    // 更新日志
    if (log) {
      await this.aiLogRepo.updateById(log.id, {
        status: AiLogStatus.Success,
        points: totalPrice,
        response: {
          ...(log.response || {}),
          duration,
          resolution,
          price: totalPrice,
        },
      })
    }
  }

  /**
   * 从 VID 获取视频并上传
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
      task.model || 'video-style-transfer',
      this.volcengineService,
      this.assetsService,
      this.logger,
      AssetType.AideoOutput,
    )
  }

  /**
   * 解析分辨率字符串，提取短边值
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
   * 获取分辨率换算系数（视频风格转换 - VCreative）
   */
  private getVCreativeResolutionCoefficient(resolution?: string): number {
    const shortSide = resolution ? this.parseShortSide(resolution) : null

    if (shortSide === null) {
      return vCreativeResolutionCoefficientMap[1].coefficient // 默认 720P
    }

    // 从高到低查找第一个阈值大于等于短边值的项
    for (let i = vCreativeResolutionCoefficientMap.length - 1; i >= 0; i--) {
      if (shortSide <= vCreativeResolutionCoefficientMap[i].threshold) {
        return vCreativeResolutionCoefficientMap[i].coefficient
      }
    }

    // 如果短边值大于所有阈值，返回最后一个（最高）系数
    return vCreativeResolutionCoefficientMap[vCreativeResolutionCoefficientMap.length - 1].coefficient
  }
}
