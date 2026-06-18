import type { RelayVideoCallbackDto, RelayVideoGenerationRequest, RelayVideoSubmitResponse } from '../../libs/relay/relay.interface'
import type { RelayVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import type { VideoTaskInput } from '../video.vo'
import { Injectable } from '@nestjs/common'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import { RelayLibService } from '../../libs/relay'
import { ModelsConfigService } from '../../models-config'

@Injectable()
export class RelayVideoService {
  constructor(
    private readonly relayLibService: RelayLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly aiAvailability: AiAvailabilityService,
  ) {}

  async createFromRequest(request: UserVideoGenerationRequestDto): Promise<{ id: string }> {
    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === request.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    if (request.mode && !(modelConfig.modes as readonly string[]).includes(request.mode)) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const startedAt = new Date()

    const payload = { ...request } as RelayVideoGenerationRequest & { userId?: string, userType?: UserType, groupId?: string }
    delete payload.userId
    delete payload.userType
    delete payload.groupId

    const result = await this.aiAvailability.executeAsync<RelayVideoSubmitResponse>(
      { provider: 'relay', operation: 'videoGeneration', model: request.model },
      () => this.relayLibService.createVideo(payload),
      response => response.id || '',
    )

    const remoteTaskId = result.id
    if (!remoteTaskId) {
      throw new AppException(ResponseCode.AiCallFailed, { error: 'Relay task id is missing' })
    }

    const logRequest: RelayVideoAiLog['request'] = {
      ...payload,
      remoteTaskId,
    }
    if (request.groupId) {
      logRequest.groupId = request.groupId
    }

    const aiLog = await this.aiLogRepo.create({
      userId: request.userId,
      userType: request.userType,
      taskId: remoteTaskId,
      model: request.model,
      channel: AiLogChannel.Relay,
      startedAt,
      type: AiLogType.Video,
      request: logRequest,
      response: {
        ...result,
      },
      status: AiLogStatus.Generating,
    })

    return { id: aiLog.id }
  }

  extractInput(request: RelayVideoAiLog['request']): VideoTaskInput {
    return {
      prompt: request.prompt || '',
      groupId: request.groupId,
      image: request.image,
      images: request.images,
      videoUrl: request.video_url,
      videos: request.videos,
      audios: request.audios,
      duration: request.duration,
      resolution: request.resolution,
      aspectRatio: request.ratio || (request.metadata?.['aspectRatio'] as string | undefined),
      watermark: request.watermark,
    }
  }

  getTaskResult(result: RelayVideoCallbackDto) {
    const status = this.normalizeStatus(result.status)
    const errorMessage = typeof result.error === 'string'
      ? result.error
      : result.error?.message

    return {
      status,
      videoUrl: result.videoUrl ? FileUtil.buildUrl(result.videoUrl) : undefined,
      coverUrl: result.coverUrl ? FileUtil.buildUrl(result.coverUrl) : undefined,
      error: errorMessage ? { message: errorMessage } : undefined,
    }
  }

  private normalizeStatus(status: string | undefined): TaskStatus {
    if (!status) {
      return TaskStatus.InProgress
    }
    const normalized = status.toLowerCase()
    if (['success', 'succeeded', 'completed', 'succeed'].includes(normalized)) {
      return TaskStatus.Success
    }
    if (['failed', 'error', 'failure'].includes(normalized)) {
      return TaskStatus.Failure
    }
    return TaskStatus.InProgress
  }

  async callback(result: RelayVideoCallbackDto): Promise<RelayVideoCallbackDto> {
    const taskId = result.id
    if (!taskId) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const aiLog = await this.aiLogRepo.getByTaskId(taskId)
    if (!aiLog || aiLog.channel !== AiLogChannel.Relay) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const relayAiLog = aiLog as RelayVideoAiLog

    if (relayAiLog.status !== AiLogStatus.Generating) {
      return relayAiLog.response!
    }

    const status = this.normalizeStatus(result.status)
    if (status === TaskStatus.InProgress) {
      return { ...result, id: taskId }
    }

    const elapsedMs = Date.now() - relayAiLog.startedAt.getTime()

    if (status === TaskStatus.Success && result.videoUrl) {
      const callbackData: RelayVideoCallbackDto = {
        ...result,
        id: taskId,
        status: 'success',
      }

      const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(
        relayAiLog.id,
        AiLogStatus.Generating,
        {
          $set: {
            status: AiLogStatus.Success,
            response: callbackData,
            duration: elapsedMs,
          },
        },
      )

      if (!updatedAiLog) {
        return relayAiLog.response!
      }

      await this.aiAvailability.recordAsyncComplete(
        taskId,
        { provider: 'relay', operation: 'videoGeneration', model: relayAiLog.model },
        { success: true, latencyMs: elapsedMs },
      )

      return callbackData
    }

    const errorMessage = (typeof result.error === 'string' ? result.error : result.error?.message)
      || (status === TaskStatus.Success ? 'Relay task completed but no video URL returned' : `Relay task ${result.status}`)
    return this.failTask(relayAiLog, taskId, { ...result, id: taskId }, errorMessage, elapsedMs)
  }

  private async failTask(aiLog: RelayVideoAiLog, taskId: string, callbackData: RelayVideoCallbackDto, errorMessage: string, elapsedMs: number): Promise<RelayVideoCallbackDto> {
    const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(
      aiLog.id,
      AiLogStatus.Generating,
      {
        $set: {
          status: AiLogStatus.Failed,
          response: callbackData,
          duration: elapsedMs,
          errorMessage,
        },
      },
    )

    if (!updatedAiLog) {
      return aiLog.response!
    }

    await this.aiAvailability.recordAsyncComplete(
      taskId,
      { provider: 'relay', operation: 'videoGeneration', model: aiLog.model },
      { success: false, latencyMs: elapsedMs, errorMessage },
    )

    return callbackData
  }
}
