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
  CreateDramaRecapTaskRequest,
  CreateDramaRecapTaskResponse,
  DramaRecapTaskStatus,
  QueryDramaRecapTaskResponse,
  VolcengineService,
} from '../libs/volcengine'
import { UserGetDramaRecapTaskRequest, UserSubmitDramaRecapTaskRequest } from './aideo.dto'

/**
 * 短剧解说服务
 * 负责短剧解说任务的提交、查询和计费
 */
@Injectable()
export class DramaRecapService {
  private readonly logger = new Logger(DramaRecapService.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly creditsHelper: CreditsHelperService,
  ) { }

  /**
   * 提交短剧解说任务
   */
  async submitDramaRecapTask(
    request: UserSubmitDramaRecapTaskRequest,
  ): Promise<{ taskId: string, dramaScriptTaskId: string }> {
    const {
      userId,
      userType,
      vids,
      dramaScriptTaskId,
      recapText,
      speakerConfig,
      isEraseSubtitle = true,
      fontConfig,
      recapStyle,
      recapTextSpeed = 1.2,
      recapTextLength,
      pauseTime = 120,
      allowRepeatMatch = false,
    } = request

    this.logger.log({ userId, vids, dramaScriptTaskId }, '[DramaRecap] 提交任务')

    const startedAt = new Date()

    // 1. 处理输入视频（如果是 URL，先上传获取 VID）
    const processedVids = await Promise.all(vids.map(async (videoInput) => {
      let vid: string
      if (videoInput.startsWith('vid://')) {
        vid = videoInput.replace('vid://', '')
      }
      else if (videoInput.startsWith('http://') || videoInput.startsWith('https://')) {
        vid = await this.volcengineService.downloadUrlAndUploadAsStream(videoInput)
      }
      else {
        // 假设直接传入的就是 VID
        vid = videoInput
      }
      return vid
    }))

    // 构建请求参数
    const apiRequest: CreateDramaRecapTaskRequest = {
      SpaceName: this.volcengineService.getSpaceName(),
      Vids: processedVids,
      DramaScriptTaskId: dramaScriptTaskId,
      // 短剧解说配置
      DramaRecapConfig: {
        // 如果提供了自定义解说词，使用它；否则启用自动生成
        ...(recapText ? { RecapText: recapText } : { AutoGenerateRecapText: true }),
        ...(recapStyle && { RecapStyle: recapStyle }),
        ...(recapTextSpeed !== undefined && { RecapTextSpeed: recapTextSpeed }),
        ...(recapTextLength !== undefined && { RecapTextLength: recapTextLength }),
        ...(pauseTime !== undefined && { PauseTime: pauseTime }),
        ...(allowRepeatMatch !== undefined && { AllowRepeatMatch: allowRepeatMatch }),
      },
      ...(speakerConfig && {
        SpeakerConfig: {
          AppId: speakerConfig.appId,
          Cluster: speakerConfig.cluster,
          VoiceType: speakerConfig.voiceType,
        },
      }),
      IsEraseSubtitle: isEraseSubtitle,
      ...(fontConfig && {
        FontConfig: {
          Color: fontConfig.color,
          Size: fontConfig.size,
          Name: fontConfig.name,
        },
      }),
    }

    // 提交任务
    const response: CreateDramaRecapTaskResponse = await this.volcengineService.createDramaRecapTask(apiRequest)

    const { TaskId: volcengineTaskId, DramaScriptTaskId: responseDramaScriptTaskId } = response

    this.logger.log({ volcengineTaskId, dramaScriptTaskId: responseDramaScriptTaskId }, '[DramaRecap] 任务提交成功')

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType: userType as UserType,
      taskId: volcengineTaskId,
      model: 'drama-recap',
      channel: AiLogChannel.Volcengine,
      startedAt,
      type: AiLogType.Aideo,
      points: 0, // 任务完成后再计费
      request: {
        vids,
        dramaScriptTaskId,
        recapText,
        speakerConfig,
        isEraseSubtitle,
        fontConfig,
        recapStyle,
        recapTextSpeed,
        recapTextLength,
        pauseTime,
        allowRepeatMatch,
      },
      response: { taskId: volcengineTaskId, dramaScriptTaskId: responseDramaScriptTaskId },
      status: AiLogStatus.Generating,
    })

    return { taskId: aiLog.id, dramaScriptTaskId: responseDramaScriptTaskId }
  }

  /**
   * 获取短剧解说任务结果（用户主动查询接口）
   * 注意：定时任务会自动处理任务状态，此方法主要用于用户主动查询
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
    const { taskId } = request

    this.logger.log({ taskId }, '[DramaRecap] 查询任务状态')

    // 从数据库查询任务记录（taskId 是数据库记录的 id，不是火山引擎的 TaskId）
    const log = await this.aiLogRepo.getById(taskId)

    if (!log || log.model !== 'drama-recap') {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    // 获取火山引擎的任务 ID
    const volcengineTaskId = log.taskId
    if (!volcengineTaskId) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    // 如果任务已完成或失败，直接返回数据库中的结果
    if (log.status === AiLogStatus.Success) {
      const response = log.response
      return {
        taskId,
        status: DramaRecapTaskStatus.Completed,
        outputVid: response?.['outputVid'],
        outputUrl: response?.['outputUrl'],
      }
    }

    if (log.status === AiLogStatus.Failed) {
      const response = log.response
      return {
        taskId,
        status: DramaRecapTaskStatus.Failed,
        errorMessage: log.errorMessage || response?.['errorMessage'] || '任务执行失败',
      }
    }

    // 查询火山引擎任务状态
    const result: QueryDramaRecapTaskResponse = await this.volcengineService.getDramaRecapTask({
      TaskId: volcengineTaskId,
      SpaceName: this.volcengineService.getSpaceName(),
    })

    // 如果任务已完成，触发处理逻辑
    if (result.Status === DramaRecapTaskStatus.Completed || result.Status === DramaRecapTaskStatus.Failed) {
      // 调用 processDramaRecapTask 处理任务（更新数据库、下载视频、扣费等）
      await this.processDramaRecapTask(log, result)

      // 重新查询数据库获取最新状态
      const updatedLog = await this.aiLogRepo.getById(log.id)
      if (updatedLog) {
        const response = updatedLog.response
        return {
          taskId,
          status: updatedLog.status === AiLogStatus.Success ? DramaRecapTaskStatus.Completed : DramaRecapTaskStatus.Failed,
          outputVid: response?.['outputVid'],
          outputUrl: response?.['outputUrl'],
          errorMessage: updatedLog.errorMessage,
        }
      }
    }

    return {
      taskId,
      status: result.Status,
    }
  }

  /**
   * 处理短剧解说任务结果（下载视频、上传 S3、计费）
   */
  async processDramaRecapTask(task: AiLog, result: QueryDramaRecapTaskResponse): Promise<void> {
    if (result.Status === DramaRecapTaskStatus.Completed && result.Vid) {
      this.logger.log({ Vid: result.Vid }, '[DramaRecap] 开始下载视频并上传到 S3')

      // 下载视频并上传到 S3
      const s3Url = await this.saveVideoFromVid(result.Vid, task, 'drama-recap')

      // 更新响应数据
      const updatedResponse = {
        ...task.response,
        outputVid: result.Vid,
        outputUrl: s3Url,
      }

      await this.aiLogRepo.updateById(task.id, {
        status: AiLogStatus.Success,
        finishedAt: new Date(),
        response: updatedResponse,
      })

      // 重新获取更新后的任务日志，然后计费
      const updatedTaskLog = await this.aiLogRepo.getById(task.id)
      if (updatedTaskLog) {
        await this.billDramaRecapTask(updatedTaskLog)
      }

      this.logger.log({ taskId: task.taskId, outputVid: result.Vid }, '[DramaRecap] 任务处理完成')
    }
    else if (result.Status === DramaRecapTaskStatus.Failed) {
      // 更新任务状态为失败
      await this.aiLogRepo.updateById(task.id, {
        status: AiLogStatus.Failed,
        finishedAt: new Date(),
        response: { ...result, errorMessage: result.ErrorMessage },
        errorMessage: result.ErrorMessage,
      })

      this.logger.error({ taskId: task.taskId, errorMessage: result.ErrorMessage }, '[DramaRecap] 任务失败')
    }
  }

  /**
   * 短剧解说任务计费
   */
  private async billDramaRecapTask(taskLog: AiLog): Promise<void> {
    // 从响应中获取输出视频的 VID
    const response = taskLog.response
    const outputVid = response?.['outputVid']

    if (!outputVid) {
      this.logger.warn({ taskId: taskLog.taskId }, '[DramaRecap] 无法获取输出视频 VID，跳过计费')
      return
    }

    // 获取视频时长
    const mediaInfos = await this.volcengineService.getMediaInfos({
      Vids: outputVid,
    })
    const duration = mediaInfos.MediaInfoList?.[0]?.SourceInfo?.Duration ?? 0

    // 计算价格
    const basePrice = config.ai.aideo.dramaRecap?.basePrice || 0.5 // 元/分钟，默认 0.5
    const durationMinutes = duration / 60
    const totalPrice = durationMinutes * basePrice

    this.logger.debug({
      taskId: taskLog.taskId,
      outputVid,
      duration,
      durationMinutes,
      basePrice,
      totalPrice,
    }, '[DramaRecap] 计算费用')

    // 只对已登录用户扣费
    if (totalPrice > 0 && taskLog.userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId: taskLog.userId,
        amount: totalPrice,
        type: CreditsType.DramaRecap,
        description: `Drama recap, task id: ${taskLog.taskId}`,
        metadata: { taskId: taskLog.taskId, duration, outputVid },
      })
    }

    // 更新任务日志中的积分消耗和视频信息
    await this.aiLogRepo.updateById(taskLog.id, {
      points: totalPrice,
      response: {
        ...response,
        duration,
        price: totalPrice,
      },
    })

    this.logger.log({
      taskId: taskLog.taskId,
      duration,
      price: totalPrice,
      userType: taskLog.userType,
    }, '[DramaRecap] 计费成功')
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
      task.model || 'drama-recap',
      this.volcengineService,
      this.assetsService,
      this.logger,
      AssetType.AideoOutput,
    )
  }
}
