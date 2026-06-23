import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, getErrorMessage, ResponseCode, UserType } from '@yikart/common'
import {
  AiLog,
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
  StyleTransferAiLogResponse,
} from '@yikart/mongodb'
import { isAxiosError } from 'axios'
import { VolcengineVideoUtils } from '../../agent/mcp/volcengine/volcengine.utils'
import {
  AsyncVCreativeTaskParamObj,
  GetVCreativeTaskResultResponse,
  VCreativeTaskStatus,
  VolcengineService,
} from '../libs/volcengine'
import { UserGetVideoStyleTransferTaskRequest, UserSubmitVideoStyleTransferRequest } from './aideo.dto'

/**
 * 视频风格转换服务
 * 负责 VCreative 视频风格转换任务的提交和查询
 */
@Injectable()
export class VideoStyleTransferService {
  private readonly logger = new Logger(VideoStyleTransferService.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
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
      const response = log.response as StyleTransferAiLogResponse | undefined
      return {
        taskId,
        status: 'Completed',
        outputVid: response?.outputVid,
        outputUrl: response?.outputUrl,
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
        const response = updatedLog.response as StyleTransferAiLogResponse | undefined
        return {
          taskId,
          status: updatedLog.status === AiLogStatus.Success ? 'Completed' : 'Failed',
          outputVid: response?.outputVid,
          outputUrl: response?.outputUrl,
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
   * 从火山引擎获取结果
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
}
