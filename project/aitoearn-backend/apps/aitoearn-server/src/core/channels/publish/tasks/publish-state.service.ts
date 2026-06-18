import type { AccountType, WorkStatus } from '@yikart/common'
import type { PublishRecord, PublishRecordLinkStatus } from '@yikart/mongodb'
import type { PublishContentInput, PublishMediaJob, PublishTaskError } from '../../platforms/platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { PublishRecordRepository, PublishStatus } from '@yikart/mongodb'
import { EventStream, EventStreamService, EventTopic } from '@yikart/redis'
import { PublishMediaType } from '../../platforms/platforms.interface'

export interface PendingPublishUpdate {
  content?: PublishContentInput
  option?: Record<string, unknown>
}

export interface PublishFailureSnapshot {
  errorMsg?: string
  errorData?: unknown
}

interface PublishCompletionResult {
  platformWorkId?: string
  permalink?: string
  publishAt?: Date
  dataOption?: Record<string, unknown>
  originalWorkLink?: string
  workStatus?: WorkStatus
  linkStatus?: PublishRecordLinkStatus
  linkMeta?: Record<string, unknown>
}

@Injectable()
export class PublishStateService {
  private readonly logger = new Logger(PublishStateService.name)

  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly eventStream: EventStreamService,
  ) {}

  async markCreated(record: { id: string, userId: string, flowId?: string, accountId: string, accountType: AccountType }) {
    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskCreated,
      record,
      { source: 'publish-state' },
    )
  }

  async markQueued(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [PublishStatus.WaitingForPublish],
      {
        status: PublishStatus.Queued,
      },
    ))
  }

  async markPublishingRetryQueued(taskId: string, error: PublishTaskError): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Publishing], {
      $set: {
        status: PublishStatus.Queued,
        errorMsg: error.message,
        errorData: this.buildErrorData(error),
      },
    }))
  }

  async markCreatedPublished(taskId: string, result: PublishCompletionResult): Promise<boolean> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || record.status !== PublishStatus.Published)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskPublished,
      this.buildPublishedEventPayload(taskId, record, result, result.publishAt ?? record.publishTime),
      { source: 'publish-state' },
    )
    return true
  }

  async markQueuedAsPublishing(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [PublishStatus.Queued],
      {
        $set: {
          status: PublishStatus.Publishing,
          errorMsg: '',
        },
        $unset: {
          errorData: '',
        },
      },
    ))
  }

  async markPublishingProgress(
    taskId: string,
    result?: {
      platformWorkId?: string
      workLink?: string
      dataOption?: Record<string, unknown>
      mediaJobs?: PublishMediaJob[]
    },
  ): Promise<boolean> {
    const update: Record<string, unknown> = {
      status: PublishStatus.Publishing,
      errorMsg: '',
    }
    if (result?.platformWorkId)
      update['platformWorkId'] = result.platformWorkId
    if (result?.workLink)
      update['workLink'] = result.workLink
    if (result?.dataOption)
      update['dataOption'] = result.dataOption
    if (result?.mediaJobs)
      update['pendingMediaJobs'] = result.mediaJobs

    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Publishing], {
      $set: update,
      $unset: {
        errorData: '',
      },
    }))
  }

  async markPlatformScheduled(taskId: string, result: { platformWorkId: string, permalink?: string, publishAt?: Date, dataOption?: Record<string, unknown> }): Promise<boolean> {
    if (!result.platformWorkId)
      return false

    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Publishing], {
      $set: {
        status: PublishStatus.PlatformScheduled,
        platformWorkId: result.platformWorkId,
        workLink: result.permalink,
        dataOption: result.dataOption,
      },
    })
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskPlatformScheduled,
      { taskId, ...result },
      { source: 'publish-state' },
    )
    return true
  }

  async markWaitingForUserAction(taskId: string, result: {
    userAction?: { schema?: string, shortLink?: string, expiresAt: Date, data?: Record<string, unknown> }
    platformWorkId?: string
    permalink?: string
    dataOption?: Record<string, unknown>
  }): Promise<boolean> {
    if (result.userAction && !result.userAction.expiresAt)
      return false

    const update: Record<string, unknown> = {
      status: PublishStatus.WaitingForUserAction,
      errorMsg: '',
    }
    if (result.platformWorkId)
      update['platformWorkId'] = result.platformWorkId
    if (result.permalink)
      update['workLink'] = result.permalink
    if (result.dataOption)
      update['dataOption'] = result.dataOption

    const allowedStatuses = result.userAction
      ? [PublishStatus.Publishing]
      : [PublishStatus.WaitingForUserAction]
    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, allowedStatuses, {
      $set: update,
      $unset: {
        errorData: '',
      },
    })
    if (!updated)
      return false

    const userAction = result.userAction
    if (userAction) {
      await this.eventStream.emit(
        EventStream.Channels,
        EventTopic.ChannelsPublishTaskWaitingForUserAction,
        {
          taskId,
          userAction,
          platformWorkId: result.platformWorkId,
          permalink: result.permalink,
          dataOption: result.dataOption,
        },
        { source: 'publish-state' },
      )
    }
    return true
  }

  async markPublished(taskId: string, result: PublishCompletionResult): Promise<boolean> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record)
      return false
    if (record.status === PublishStatus.Published) {
      if (result.platformWorkId && record.platformWorkId !== result.platformWorkId) {
        return false
      }

      const supplement = this.buildPublishedSupplementUpdate(record, result)
      if (!Object.keys(supplement).length) {
        return true
      }
      return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Published], {
        $set: supplement,
      }))
    }

    const allowedStatuses = [PublishStatus.Publishing, PublishStatus.PlatformScheduled, PublishStatus.WaitingForUserAction]
    const publishTime = result.publishAt ?? new Date()
    const update: Record<string, unknown> = {
      status: PublishStatus.Published,
      publishTime,
      errorMsg: '',
    }
    if (result.platformWorkId) {
      update['platformWorkId'] = result.platformWorkId
      update['dataId'] = result.platformWorkId
      update['uniqueId'] = `${record.accountType}_${result.platformWorkId}`
    }
    if (result.permalink)
      update['workLink'] = result.permalink
    if (result.dataOption)
      update['dataOption'] = this.mergeRecordData(record.dataOption, result.dataOption)
    if (result.originalWorkLink !== undefined)
      update['originalWorkLink'] = result.originalWorkLink
    if (result.workStatus)
      update['workStatus'] = result.workStatus
    if (result.linkStatus !== undefined)
      update['linkStatus'] = result.linkStatus
    if (result.linkMeta)
      update['linkMeta'] = this.mergeRecordData(record.linkMeta, result.linkMeta)

    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, allowedStatuses, {
      $set: update,
      $unset: {
        errorData: '',
        pendingMediaJobs: '',
      },
    })
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskPublished,
      this.buildPublishedEventPayload(taskId, record, result, publishTime),
      { source: 'publish-state' },
    )
    return true
  }

  private buildPublishedSupplementUpdate(record: PublishRecord, result: PublishCompletionResult): Record<string, unknown> {
    const update: Record<string, unknown> = {}
    if (result.permalink && record.workLink !== result.permalink)
      update['workLink'] = result.permalink
    if (result.dataOption)
      update['dataOption'] = this.mergeRecordData(record.dataOption, result.dataOption)
    if (result.originalWorkLink !== undefined && record.originalWorkLink !== result.originalWorkLink)
      update['originalWorkLink'] = result.originalWorkLink
    if (result.workStatus && record.workStatus !== result.workStatus)
      update['workStatus'] = result.workStatus
    if (result.linkStatus !== undefined && record.linkStatus !== result.linkStatus)
      update['linkStatus'] = result.linkStatus
    if (result.linkMeta)
      update['linkMeta'] = this.mergeRecordData(record.linkMeta, result.linkMeta)
    return update
  }

  private buildPublishedEventPayload(
    taskId: string,
    record: PublishRecord,
    result: PublishCompletionResult,
    publishedAt?: Date,
  ) {
    const platformWorkId = result.platformWorkId ?? record.platformWorkId
    const workLink = result.permalink ?? record.workLink
    return {
      taskId,
      publishRecordId: taskId,
      userId: record.userId,
      accountId: record.accountId,
      accountType: record.accountType,
      uid: record.uid,
      platformWorkId,
      permalink: result.permalink,
      publishAt: result.publishAt ?? publishedAt,
      dataOption: result.dataOption ?? record.dataOption,
      originalWorkLink: result.originalWorkLink ?? record.originalWorkLink,
      workStatus: result.workStatus ?? record.workStatus,
      dataId: platformWorkId ?? record.dataId,
      workLink,
      flowId: record.flowId,
      materialId: record.materialId,
      source: record.source,
      publishedAt,
      linkStatus: result.linkStatus ?? record.linkStatus,
      linkMeta: result.linkMeta ?? record.linkMeta,
    }
  }

  private mergeRecordData(
    current: Record<string, unknown> | undefined,
    next: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...(current ?? {}),
      ...next,
    }
  }

  async markFailed(taskId: string, error: PublishTaskError): Promise<boolean> {
    const updated = await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [
        PublishStatus.WaitingForPublish,
        PublishStatus.Queued,
        PublishStatus.Publishing,
        PublishStatus.PlatformScheduled,
        PublishStatus.WaitingForUserAction,
        PublishStatus.WaitingForUpdate,
        PublishStatus.Updating,
        PublishStatus.UpdatedFailed,
      ],
      {
        $set: {
          status: PublishStatus.Failed,
          errorMsg: error.message,
          errorData: this.buildErrorData(error),
        },
      },
    )
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskFailed,
      { taskId, error },
      { source: 'publish-state' },
    )
    return true
  }

  async markFailedAsWaitingForPublish(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [PublishStatus.Failed],
      {
        $set: {
          status: PublishStatus.WaitingForPublish,
          publishTime: new Date(),
          errorMsg: '',
        },
        $unset: {
          errorData: '',
        },
      },
    ))
  }

  async markFailedAsPublishing(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [PublishStatus.Failed],
      {
        $set: {
          status: PublishStatus.Publishing,
          errorMsg: '',
        },
        $unset: {
          errorData: '',
        },
      },
    ))
  }

  async restoreRetryStateToFailed(taskId: string, previous: PublishFailureSnapshot): Promise<boolean> {
    const update = previous.errorData === undefined
      ? {
          $set: {
            status: PublishStatus.Failed,
            errorMsg: previous.errorMsg ?? '',
          },
          $unset: {
            errorData: '',
          },
        }
      : {
          $set: {
            status: PublishStatus.Failed,
            errorMsg: previous.errorMsg ?? '',
            errorData: previous.errorData,
          },
        }

    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(
      taskId,
      [
        PublishStatus.WaitingForPublish,
        PublishStatus.Queued,
        PublishStatus.Publishing,
      ],
      update,
    ))
  }

  async markCanceled(taskId: string, reason?: string): Promise<boolean> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record)
      return false

    const allowedStatuses = [
      PublishStatus.WaitingForPublish,
      PublishStatus.Queued,
      PublishStatus.PlatformScheduled,
      PublishStatus.WaitingForUserAction,
    ]
    if (!allowedStatuses.includes(record.status))
      return false

    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, allowedStatuses, {
      $set: {
        status: PublishStatus.Canceled,
      },
    })
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskCanceled,
      { taskId, reason },
      { source: 'publish-state' },
    )
    return true
  }

  async markWaitingForUpdate(taskId: string, updateInput: PendingPublishUpdate): Promise<boolean> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record)
      return false
    if (record.status !== PublishStatus.Published && record.status !== PublishStatus.UpdatedFailed)
      return false
    if (!record.platformWorkId)
      return false

    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Published, PublishStatus.UpdatedFailed], {
      $set: {
        status: PublishStatus.WaitingForUpdate,
        pendingUpdate: updateInput,
        errorMsg: '',
      },
      $unset: {
        errorData: '',
      },
    }))
  }

  async markUpdating(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.WaitingForUpdate], {
      status: PublishStatus.Updating,
    }))
  }

  async markUpdated(taskId: string): Promise<boolean> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || record.status !== PublishStatus.Updating)
      return false

    const pendingUpdate = record.pendingUpdate as PendingPublishUpdate | undefined
    const content = pendingUpdate?.content
    const update: Record<string, unknown> = {
      status: PublishStatus.Published,
      errorMsg: '',
    }
    if (content) {
      const media = this.resolveRecordMedia(content)
      const cover = content.cover

      update['title'] = content.title
      update['desc'] = content.body
      update['videoUrl'] = media.videoUrl
      update['imgUrlList'] = media.imgUrlList
      update['coverUrl'] = cover?.url
    }
    if (pendingUpdate && 'option' in pendingUpdate) {
      update['option'] = pendingUpdate.option
    }

    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Updating], {
      $set: update,
      $unset: {
        errorData: '',
        pendingUpdate: '',
      },
    })
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskUpdated,
      { taskId },
      { source: 'publish-state' },
    )
    return true
  }

  async markUpdatedFailed(taskId: string, error: PublishTaskError): Promise<boolean> {
    const updated = await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Updating], {
      $set: {
        status: PublishStatus.UpdatedFailed,
        errorMsg: error.message,
        errorData: this.buildErrorData(error),
      },
    })
    if (!updated)
      return false

    await this.eventStream.emit(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskUpdateFailed,
      { taskId, error },
      { source: 'publish-state' },
    )
    return true
  }

  async restoreQueuedToWaiting(taskId: string): Promise<boolean> {
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Queued], {
      status: PublishStatus.WaitingForPublish,
    }))
  }

  async restorePublishingToWaiting(taskId: string, error?: PublishTaskError): Promise<boolean> {
    const update = {
      status: PublishStatus.WaitingForPublish,
      errorMsg: error?.message,
      errorData: error ? this.buildErrorData(error) : undefined,
    }
    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.Publishing], {
      $set: update,
    }))
  }

  async restoreWaitingForUpdate(
    taskId: string,
    status: PublishStatus.Published | PublishStatus.UpdatedFailed,
    previous?: { errorMsg?: string, errorData?: unknown },
  ): Promise<boolean> {
    const update: Record<string, unknown> = {
      status,
    }
    if (previous?.errorMsg)
      update['errorMsg'] = previous.errorMsg
    if (previous?.errorData)
      update['errorData'] = previous.errorData

    return Boolean(await this.publishRecordRepo.updateByIdAndStatuses(taskId, [PublishStatus.WaitingForUpdate], {
      $set: update,
      $unset: {
        pendingUpdate: '',
        ...(previous?.errorData ? {} : { errorData: '' }),
      },
    }))
  }

  private resolveRecordMedia(content: PublishContentInput): { videoUrl?: string, imgUrlList: string[] } {
    const video = content.media.find(media => this.isVideoMedia(media))
    if (video) {
      return {
        videoUrl: video.url,
        imgUrlList: [],
      }
    }

    return {
      imgUrlList: content.media.map(media => media.url),
    }
  }

  private buildErrorData(error: PublishTaskError): { type: string, code: string, message: string, originalData?: unknown } {
    return {
      type: error.category,
      code: error.code ?? '',
      message: error.message,
      originalData: error.originalData,
    }
  }

  private isVideoMedia(media: { url: string, metadata?: { type?: unknown } }): boolean {
    if (media.metadata?.type === PublishMediaType.Video) {
      return true
    }
    const pathname = this.getUrlPathname(media.url).toLowerCase()
    return ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'].some(extension => pathname.endsWith(extension))
  }

  private getUrlPathname(url: string): string {
    try {
      return new URL(url).pathname
    }
    catch {
      return url
    }
  }
}
