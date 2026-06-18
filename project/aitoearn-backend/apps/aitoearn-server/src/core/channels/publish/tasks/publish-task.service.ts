import type { AccountType } from '@yikart/common'
import type { PublishRecord } from '@yikart/mongodb'
import type { PlatformMediaPolicy, PlatformMediaRules, PlatformPublishPolicy, PublishContentInput, PublishMediaJob, PublishProvider, PublishProviderResult } from '../../platforms/platforms.interface'
import type { PublishValidationIssue } from '../../platforms/publish.schema'
import type { PendingPublishUpdate, PublishFailureSnapshot } from './publish-state.service'
import type { PublishUpdateData } from './publish-update.schema'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, getCodeMessage, getLocale, ResponseCode } from '@yikart/common'
import { AccountRepository, PublishRecordRepository, PublishStatus, Transactional } from '@yikart/mongodb'
import { z } from 'zod'
import { AuthService } from '../../auth/auth.service'
import { MediaService } from '../../media/media.service'
import { ChannelPlatformException, PlatformErrorCategory } from '../../platforms/platforms.exception'
import {
  CompletionStrategy,

  PublishMediaType,

} from '../../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../../platforms/platforms.registry'
import { formatPublishValidationIssue } from '../../platforms/publish.schema'
import { PublishQueueService } from './publish-queue.service'
import { PublishStateService } from './publish-state.service'

interface PublishRuntime {
  provider: PublishProvider
  publishPolicy: PlatformPublishPolicy
  optionSchema: z.ZodTypeAny
  mediaRules: PlatformMediaRules
  mediaPolicy?: PlatformMediaPolicy
}

@Injectable()
export class PublishTaskService {
  private readonly logger = new Logger(PublishTaskService.name)

  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly accountRepo: AccountRepository,
    private readonly registry: PlatformIntegrationRegistry,
    private readonly mediaService: MediaService,
    private readonly authService: AuthService,
    private readonly stateService: PublishStateService,
    private readonly queueService: PublishQueueService,
  ) {}

  async processPublishJob(taskId: string, attempts = 0): Promise<void> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record) {
      this.logger.warn({ taskId }, 'Publish task not found')
      return
    }

    const publishing = await this.stateService.markQueuedAsPublishing(taskId)
    if (!publishing) {
      this.logger.log({ taskId, status: record.status }, 'Publish task is not queued, skipping')
      return
    }

    try {
      const { provider, publishPolicy } = this.getPublishRuntime(record.accountType)
      const account = await this.getRecordAccount(record)
      const credential = await this.authService.getValidCredential(account.accountId, record.userId)

      const result = await provider.publish({
        taskId,
        platform: record.accountType,
        accountId: account.accountId,
        content: this.buildPublishContent(record),
        option: record.option,
        publishAt: record.publishTime,
        credential: {
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          platformUid: account.platformUid,
          account: account.account,
        },
      })

      if (result.userAction) {
        const waiting = await this.stateService.markWaitingForUserAction(taskId, {
          userAction: result.userAction,
          platformWorkId: result.platformWorkId,
          permalink: result.permalink,
          dataOption: result.dataOption,
        })
        if (waiting && this.canPollUserActionResult(publishPolicy, provider)) {
          try {
            await this.queueService.enqueueMediaFinalize(taskId, this.getFinalizeDelayMs(record.accountType))
          }
          catch (enqueueErr) {
            this.logger.warn(enqueueErr, `Failed to enqueue user action finalize job for task ${taskId}`)
          }
        }
      }
      else if (this.isFailedResult(result)) {
        await this.stateService.markFailed(taskId, {
          category: PlatformErrorCategory.Unknown,
          message: this.getResultErrorMessage(result),
          retryable: false,
          occurredAt: new Date(),
        })
      }
      else if (result.platformWorkId && publishPolicy.scheduleByPlatform) {
        await this.stateService.markPlatformScheduled(taskId, {
          platformWorkId: result.platformWorkId,
          permalink: result.permalink,
          dataOption: result.dataOption,
        })
      }
      else if (this.isPendingResult(publishPolicy.completionStrategy, result)) {
        await this.stateService.markPublishingProgress(taskId, {
          platformWorkId: result.platformWorkId,
          workLink: result.permalink,
          dataOption: result.dataOption,
          mediaJobs: result.mediaJobs,
        })
        try {
          await this.queueService.enqueueMediaFinalize(taskId)
        }
        catch (enqueueErr) {
          this.logger.warn(enqueueErr, `Failed to enqueue finalize job for publishing task ${taskId}`)
        }
      }
      else {
        await this.stateService.markPublished(taskId, {
          platformWorkId: result.platformWorkId,
          permalink: result.permalink,
          dataOption: result.dataOption,
          originalWorkLink: result.originalWorkLink,
          workStatus: result.workStatus,
          linkStatus: result.linkStatus,
          linkMeta: result.linkMeta,
        })
      }
    }
    catch (err) {
      this.logger.error(err, `Failed to publish task ${taskId}`)
      await this.markAccountOfflineForPlatformAuthFailure(record, err)
      const error: {
        category: PlatformErrorCategory
        code?: string
        message?: string
        originalData?: unknown
        retryable: boolean
      } = err instanceof ChannelPlatformException
        ? err.toTaskFailure()
        : { category: PlatformErrorCategory.Unknown, retryable: false }

      const failure = {
        category: error.category,
        code: error.code,
        message: this.getErrorMessage(err, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
        originalData: error.originalData,
        retryable: error.retryable,
        occurredAt: new Date(),
      }

      if (failure.retryable && attempts + 1 < 3) {
        const nextAttempts = attempts + 1
        const queued = await this.stateService.markPublishingRetryQueued(taskId, failure)
        if (!queued) {
          this.logger.warn({
            taskId,
            platform: record.accountType,
            attempts,
            nextAttempts,
            category: failure.category,
            code: failure.code,
          }, 'Failed to queue retryable publish task')
          return
        }

        try {
          await this.queueService.enqueueImmediate(taskId, nextAttempts)
        }
        catch (enqueueErr) {
          await this.stateService.restoreQueuedToWaiting(taskId)
          throw enqueueErr
        }
        return
      }

      await this.stateService.markFailed(taskId, failure)
    }
  }

  async processFinalizeJob(taskId: string, attempts = 0): Promise<void> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || ![PublishStatus.Publishing, PublishStatus.WaitingForUserAction].includes(record.status))
      return

    try {
      const { provider, publishPolicy } = this.getPublishRuntime(record.accountType)
      if (record.status === PublishStatus.WaitingForUserAction && publishPolicy.completionStrategy !== CompletionStrategy.UserHandoff)
        return

      if (!provider.finalize) {
        if (provider.verify) {
          await this.verifyFinalizeRecord(record, provider, attempts)
        }
        return
      }

      const account = await this.getRecordAccount(record)
      const credential = await this.authService.getValidCredential(account.accountId, record.userId)
      const result = await provider.finalize({
        taskId,
        platform: record.accountType,
        platformWorkId: record.platformWorkId ?? '',
        mediaJobs: this.getPendingMediaJobs(record),
        dataOption: record.dataOption,
        credential: {
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          platformUid: account.platformUid,
          account: account.account,
        },
      })

      if (this.isFailedResult(result)) {
        await this.stateService.markFailed(taskId, {
          category: PlatformErrorCategory.Unknown,
          message: this.getResultErrorMessage(result),
          retryable: false,
          occurredAt: new Date(),
        })
        return
      }

      if (this.isPendingResult(publishPolicy.completionStrategy, result)) {
        if (!this.canContinueFinalizePolling(record, attempts + 1)) {
          await this.stateService.markFailed(taskId, {
            category: PlatformErrorCategory.Timeout,
            message: this.getErrorMessage(undefined, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
            retryable: false,
            occurredAt: new Date(),
          })
          return
        }

        if (record.status === PublishStatus.WaitingForUserAction) {
          await this.stateService.markWaitingForUserAction(taskId, {
            platformWorkId: result.platformWorkId,
            permalink: result.permalink,
            dataOption: result.dataOption,
          })
        }
        else {
          await this.stateService.markPublishingProgress(taskId, {
            platformWorkId: result.platformWorkId,
            workLink: result.permalink,
            dataOption: result.dataOption,
            mediaJobs: result.mediaJobs,
          })
        }
        await this.queueService.enqueueMediaFinalize(taskId, this.getFinalizeDelayMs(record.accountType), attempts + 1)
        return
      }

      await this.stateService.markPublished(taskId, {
        platformWorkId: result.platformWorkId,
        permalink: result.permalink,
        dataOption: result.dataOption,
        originalWorkLink: result.originalWorkLink,
        workStatus: result.workStatus,
        linkStatus: result.linkStatus,
        linkMeta: result.linkMeta,
      })
    }
    catch (err) {
      this.logger.error(err, `Failed to finalize task ${taskId}`)
      await this.markAccountOfflineForPlatformAuthFailure(record, err)
      const error: {
        category: PlatformErrorCategory
        code?: string
        message?: string
        originalData?: unknown
        retryable: boolean
      } = err instanceof ChannelPlatformException
        ? err.toTaskFailure()
        : {
            category: PlatformErrorCategory.MediaProcessingFailed,
            code: undefined,
            message: undefined,
            retryable: false,
          }
      const failure = {
        category: error.category,
        code: error.code,
        message: this.getErrorMessage(err, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
        originalData: error.originalData,
        retryable: error.retryable,
        occurredAt: new Date(),
      }

      if (failure.retryable && this.canContinueFinalizePolling(record, attempts + 1)) {
        await this.queueService.enqueueMediaFinalize(taskId, this.getFinalizeDelayMs(record.accountType), attempts + 1)
        return
      }

      await this.stateService.markFailed(taskId, failure)
    }
  }

  async processPublishingTimeout(taskId: string): Promise<void> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || record.status !== PublishStatus.Publishing)
      return

    if (!record.platformWorkId) {
      this.logger.warn({ taskId, platform: record.accountType }, 'Publishing task timed out before platform work ID was recorded')
      return
    }

    const { provider } = this.getPublishRuntime(record.accountType)
    if (provider.finalize) {
      await this.processFinalizeJob(taskId)
      return
    }

    if (provider.verify) {
      await this.verifyPublishingRecord(record, provider)
      return
    }

    this.logger.warn({ taskId, platform: record.accountType }, 'Publishing task timed out without finalize or verify support')
    await this.stateService.markFailed(taskId, {
      category: PlatformErrorCategory.Timeout,
      message: this.getErrorMessage(undefined, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
      retryable: false,
      occurredAt: new Date(),
    })
  }

  async processUpdateJob(taskId: string): Promise<void> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || !record.platformWorkId)
      return

    const updating = await this.stateService.markUpdating(taskId)
    if (!updating)
      return

    try {
      const { provider, publishPolicy } = this.getPublishRuntime(record.accountType)
      if (!provider.update || publishPolicy.updateSupported !== true) {
        await this.stateService.markUpdatedFailed(taskId, {
          category: PlatformErrorCategory.Validation,
          message: getCodeMessage(ResponseCode.ChannelPublishUpdateNotSupported),
          retryable: false,
          occurredAt: new Date(),
        })
        return
      }

      const account = await this.getRecordAccount(record)
      const credential = await this.authService.getValidCredential(account.accountId, record.userId)
      const result = await provider.update({
        taskId,
        platform: record.accountType,
        platformWorkId: record.platformWorkId,
        content: this.buildUpdateContent(record),
        option: this.getUpdateOption(record),
        credential: {
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          platformUid: account.platformUid,
          account: account.account,
        },
      })

      if (this.isFailedResult(result)) {
        await this.stateService.markUpdatedFailed(taskId, {
          category: PlatformErrorCategory.Unknown,
          message: this.getResultErrorMessage(result),
          retryable: false,
          occurredAt: new Date(),
        })
        return
      }

      await this.stateService.markUpdated(taskId)
    }
    catch (err) {
      this.logger.error(err, `Failed to update task ${taskId}`)
      await this.markAccountOfflineForPlatformAuthFailure(record, err)
      const error: {
        category: PlatformErrorCategory
        code?: string
        originalData?: unknown
        retryable: boolean
      } = err instanceof ChannelPlatformException
        ? err.toTaskFailure()
        : { category: PlatformErrorCategory.Unknown, retryable: false }
      await this.stateService.markUpdatedFailed(taskId, {
        category: error.category,
        code: error.code,
        message: this.getErrorMessage(err, ResponseCode.PublishTaskUpdateFailed),
        originalData: error.originalData,
        retryable: error.retryable,
        occurredAt: new Date(),
      })
    }
  }

  async cancelTask(userId: string, taskId: string): Promise<void> {
    const record = await this.getTaskForUser(taskId, userId)

    if (record.status === PublishStatus.Queued) {
      const removed = await this.queueService.removeJob(taskId)
      if (!removed) {
        throw new AppException(ResponseCode.ChannelPublishQueueRemoveFailed)
      }
    }

    if (record.status === PublishStatus.PlatformScheduled && record.platformWorkId) {
      const { provider } = this.getPublishRuntime(record.accountType)
      if (provider.cancel) {
        const account = await this.getRecordAccount(record)
        const credential = await this.authService.getValidCredential(account.accountId, record.userId)
        const result = await provider.cancel({
          taskId,
          platform: record.accountType,
          platformWorkId: record.platformWorkId,
          credential: {
            accessToken: credential.accessToken,
            refreshToken: credential.refreshToken,
            platformUid: account.platformUid,
            account: account.account,
          },
        })
        if (!result.canceled) {
          throw new AppException(ResponseCode.ChannelPublishPlatformCancelFailed)
        }
      }
      else {
        throw new AppException(ResponseCode.ChannelPublishCancelNotSupported)
      }
    }

    await this.stateService.markCanceled(taskId, 'user_requested')
  }

  async publishNow(userId: string, taskId: string): Promise<void> {
    const record = await this.getTaskForUser(taskId, userId)

    if (record.status !== PublishStatus.WaitingForPublish && record.status !== PublishStatus.Queued) {
      throw new AppException(ResponseCode.ChannelPublishNowNotAllowed)
    }

    if (record.status === PublishStatus.Queued) {
      const removed = await this.queueService.removeJob(taskId)
      if (!removed) {
        throw new AppException(ResponseCode.ChannelPublishQueueRemoveFailed)
      }
    }

    await this.updatePublishTimeInStore(userId, taskId, new Date(), ResponseCode.ChannelPublishNowNotAllowed)
    const queued = await this.stateService.markQueued(taskId)
    if (!queued) {
      throw new AppException(ResponseCode.ChannelPublishQueueFailed)
    }
    try {
      await this.queueService.enqueueImmediate(taskId)
    }
    catch (err) {
      await this.stateService.restoreQueuedToWaiting(taskId)
      throw err
    }
  }

  async retryTask(userId: string, taskId: string): Promise<void> {
    const record = await this.getTaskForUser(taskId, userId)

    if (record.status !== PublishStatus.Failed) {
      throw new AppException(ResponseCode.ChannelPublishRetryNotAllowed)
    }

    const previousFailure = {
      errorMsg: record.errorMsg,
      errorData: record.errorData,
    }

    if (record.platformWorkId) {
      const { provider } = this.getPublishRuntime(record.accountType)
      if (!provider.finalize) {
        throw new AppException(ResponseCode.ChannelPublishRetryNotAllowed)
      }

      const publishing = await this.stateService.markFailedAsPublishing(taskId)
      if (!publishing) {
        throw new AppException(ResponseCode.ChannelPublishRetryNotAllowed)
      }

      try {
        await this.queueService.enqueueMediaFinalize(taskId)
      }
      catch (err) {
        await this.stateService.restoreRetryStateToFailed(taskId, previousFailure)
        throw err
      }
      return
    }

    await this.retryUnsubmittedTask(taskId, previousFailure)
  }

  async updatePublishAt(userId: string, taskId: string, publishAt: Date): Promise<void> {
    const record = await this.getTaskForUser(taskId, userId)

    if (record.status !== PublishStatus.WaitingForPublish && record.status !== PublishStatus.Queued) {
      throw new AppException(ResponseCode.ChannelPublishTimeUpdateNotAllowed)
    }

    if (record.status === PublishStatus.Queued) {
      const removed = await this.queueService.removeJob(taskId)
      if (!removed) {
        throw new AppException(ResponseCode.ChannelPublishQueueRemoveFailed)
      }
    }

    const scheduleRecord = await this.updatePublishTimeInStore(
      userId,
      taskId,
      publishAt,
      ResponseCode.ChannelPublishTimeUpdateNotAllowed,
    )

    const now = new Date()
    const diffMs = publishAt.getTime() - now.getTime()
    const scheduleWindow = this.getScheduleWindow(scheduleRecord.accountType)

    if (diffMs <= scheduleWindow) {
      const queued = await this.stateService.markQueued(taskId)
      if (!queued) {
        throw new AppException(ResponseCode.ChannelPublishQueueFailed)
      }
      if (diffMs <= 0) {
        try {
          await this.queueService.enqueueImmediate(taskId)
        }
        catch (err) {
          await this.stateService.restoreQueuedToWaiting(taskId)
          throw err
        }
      }
      else {
        try {
          await this.queueService.enqueueDelayed(taskId, diffMs)
        }
        catch (err) {
          await this.stateService.restoreQueuedToWaiting(taskId)
          throw err
        }
      }
    }
  }

  async requestUpdate(userId: string, taskId: string, updateData: PublishUpdateData): Promise<void> {
    const record = await this.getTaskForUser(taskId, userId)

    if (!record.platformWorkId) {
      throw new AppException(ResponseCode.ChannelPublishPlatformWorkIdMissing)
    }

    const { provider, publishPolicy, optionSchema, mediaRules, mediaPolicy } = this.getPublishRuntime(record.accountType)
    if (!provider.update || publishPolicy.updateSupported !== true) {
      throw new AppException(ResponseCode.ChannelPublishUpdateNotSupported)
    }

    const rawOption = updateData.option === undefined
      ? record.option
      : optionSchema.parse(updateData.option) as Record<string, unknown>
    const option = rawOption
    const pendingUpdate = this.buildPendingUpdate(record, updateData, option)
    const initialMediaRules = this.resolveMediaRules(
      provider,
      record.accountType,
      this.requireAccountId(record),
      pendingUpdate.content,
      option,
      mediaRules,
    )
    const prepared = await this.mediaService.preparePublishContentMedia({
      userId,
      content: pendingUpdate.content,
      mediaRules: initialMediaRules,
      mediaPolicy,
    })
    const issues = [...prepared.issues]
    if (issues.length === 0 && this.hasActiveMediaAdaptation(pendingUpdate.content)) {
      issues.push(...await this.mediaService.validateMedia(
        prepared.content,
        this.resolveMediaRules(provider, record.accountType, this.requireAccountId(record), prepared.content, option, mediaRules),
      ))
    }
    if (issues.length > 0) {
      this.throwValidationFailed(record.accountType, this.requireAccountId(record), issues)
    }

    const waiting = await this.stateService.markWaitingForUpdate(taskId, {
      ...pendingUpdate,
      content: prepared.content,
    })
    if (!waiting) {
      throw new AppException(ResponseCode.ChannelPublishUpdateNotAllowed)
    }
    try {
      await this.queueService.enqueueUpdate(taskId)
    }
    catch (err) {
      await this.stateService.restoreWaitingForUpdate(
        taskId,
        record.status === PublishStatus.UpdatedFailed ? PublishStatus.UpdatedFailed : PublishStatus.Published,
        {
          errorMsg: record.errorMsg,
          errorData: record.errorData,
        },
      )
      throw err
    }
  }

  private async retryUnsubmittedTask(taskId: string, previousFailure: PublishFailureSnapshot): Promise<void> {
    const waiting = await this.stateService.markFailedAsWaitingForPublish(taskId)
    if (!waiting) {
      throw new AppException(ResponseCode.ChannelPublishRetryNotAllowed)
    }

    const queued = await this.stateService.markQueued(taskId)
    if (!queued) {
      await this.stateService.restoreRetryStateToFailed(taskId, previousFailure)
      throw new AppException(ResponseCode.ChannelPublishQueueFailed)
    }

    try {
      await this.queueService.enqueueImmediate(taskId)
    }
    catch (err) {
      await this.stateService.restoreRetryStateToFailed(taskId, previousFailure)
      throw err
    }
  }

  private getPublishRuntime(platform: AccountType): PublishRuntime {
    const integration = this.registry.get(platform)
    const provider = integration.publish
    const publishPolicy = integration.metadata.publishPolicy
    if (!provider || !publishPolicy) {
      throw new AppException(ResponseCode.ChannelPublishPlatformNotSupported, { platform })
    }
    return {
      provider,
      publishPolicy,
      optionSchema: integration.metadata.optionSchema,
      mediaRules: integration.metadata.mediaRules,
      mediaPolicy: integration.runtime.media,
    }
  }

  private resolveMediaRules(
    provider: PublishProvider,
    platform: AccountType,
    accountId: string,
    content: PublishContentInput,
    option: Record<string, unknown> | undefined,
    fallback: PlatformMediaRules,
  ): PlatformMediaRules {
    return provider.resolveMediaRules?.({
      platform,
      accountId,
      content,
      option,
    }) ?? fallback
  }

  private hasActiveMediaAdaptation(content: PublishContentInput): boolean {
    const imageFormats = [
      ...content.media.map(media => media.options?.adaptation?.imageFormat),
      content.cover?.options?.adaptation?.imageFormat,
    ]
    return imageFormats.some(format => Boolean(format && format !== 'off'))
  }

  private throwValidationFailed(platform: AccountType, accountId: string, issues: PublishValidationIssue[]): never {
    const locale = getLocale()
    throw new AppException(ResponseCode.ChannelPublishValidationFailed, {
      platform,
      accountId,
      issues: issues.map(issue => formatPublishValidationIssue(issue, locale)),
    })
  }

  private getErrorMessage(err: unknown, fallbackCode: ResponseCode, fallbackData?: unknown): string {
    if (err instanceof AppException) {
      const response = err.getResponse()
      if (response && typeof response === 'object') {
        const message = (response as { message?: unknown }).message
        if (typeof message === 'string') {
          return message
        }
      }
      return err.message
    }

    if (err instanceof Error && err.message) {
      return err.message
    }

    return getCodeMessage(fallbackCode, fallbackData)
  }

  private requireAccountId(record: PublishRecord): string {
    if (!record.accountId) {
      throw new AppException(ResponseCode.ChannelAccountNotFound)
    }
    return record.accountId
  }

  private async markAccountOfflineForPlatformAuthFailure(record: PublishRecord, error: unknown): Promise<void> {
    if (!record.accountId || !(error instanceof ChannelPlatformException)) {
      return
    }
    await this.authService.markAccountOfflineForCredentialFailure(record.accountId, error, 'platform_auth_failed')
  }

  private async getTaskForUser(taskId: string, userId: string): Promise<PublishRecord> {
    const record = await this.publishRecordRepo.getById(taskId)
    if (!record || record.userId !== userId) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    return record
  }

  @Transactional()
  private async updatePublishTimeInStore(
    userId: string,
    taskId: string,
    publishAt: Date,
    notAllowedCode: ResponseCode,
  ): Promise<PublishRecord> {
    const record = await this.getTaskForUser(taskId, userId)
    if (record.status !== PublishStatus.WaitingForPublish && record.status !== PublishStatus.Queued) {
      throw new AppException(notAllowedCode)
    }

    await this.publishRecordRepo.updateById(taskId, {
      publishTime: publishAt,
      status: PublishStatus.WaitingForPublish,
    })
    return record
  }

  private async getRecordAccount(record: PublishRecord): Promise<{ accountId: string, platformUid: string, account?: string }> {
    const accountId = this.requireAccountId(record)
    const account = await this.accountRepo.getByIdAndUserId(accountId, record.userId)
    if (!account || account.type !== record.accountType || !account.uid) {
      throw new AppException(ResponseCode.ChannelAccountNotFound)
    }
    return { accountId, platformUid: account.uid, account: account.account }
  }

  private async verifyPublishingRecord(record: PublishRecord, provider: PublishProvider): Promise<void> {
    const account = await this.getRecordAccount(record)
    const credential = await this.authService.getValidCredential(account.accountId, record.userId)
    const result = await provider.verify!({
      taskId: record.id,
      platform: record.accountType,
      platformWorkId: record.platformWorkId!,
      dataOption: record.dataOption,
      credential: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        platformUid: account.platformUid,
        account: account.account,
      },
    })

    if (!result.published) {
      await this.stateService.markFailed(record.id, {
        category: PlatformErrorCategory.Timeout,
        message: this.getErrorMessage(undefined, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
        retryable: false,
        occurredAt: new Date(),
      })
      return
    }

    await this.stateService.markPublished(record.id, {
      platformWorkId: result.platformWorkId ?? record.platformWorkId,
      permalink: result.permalink,
      linkStatus: result.linkStatus,
      linkMeta: result.linkMeta,
    })
  }

  private async verifyFinalizeRecord(record: PublishRecord, provider: PublishProvider, attempts: number): Promise<void> {
    if (!record.platformWorkId) {
      return
    }

    const account = await this.getRecordAccount(record)
    const credential = await this.authService.getValidCredential(account.accountId, record.userId)
    const result = await provider.verify!({
      taskId: record.id,
      platform: record.accountType,
      platformWorkId: record.platformWorkId,
      dataOption: record.dataOption,
      credential: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        platformUid: account.platformUid,
        account: account.account,
      },
    })

    if (result.published) {
      await this.stateService.markPublished(record.id, {
        platformWorkId: result.platformWorkId ?? record.platformWorkId,
        permalink: result.permalink,
        linkStatus: result.linkStatus,
        linkMeta: result.linkMeta,
      })
      return
    }

    if (!this.canContinueFinalizePolling(record, attempts + 1)) {
      await this.stateService.markFailed(record.id, {
        category: PlatformErrorCategory.Timeout,
        message: this.getErrorMessage(undefined, ResponseCode.PublishTaskFailed, { accountType: record.accountType }),
        retryable: false,
        occurredAt: new Date(),
      })
      return
    }

    await this.queueService.enqueueMediaFinalize(record.id, this.getFinalizeDelayMs(record.accountType), attempts + 1)
  }

  private canPollUserActionResult(publishPolicy: PlatformPublishPolicy, provider: PublishProvider): boolean {
    return publishPolicy.completionStrategy === CompletionStrategy.UserHandoff
      && Boolean(provider.finalize || provider.verify)
  }

  private canContinueFinalizePolling(record: PublishRecord, nextAttempts: number): boolean {
    if (record.status === PublishStatus.WaitingForUserAction) {
      const expiresAt = this.getUserActionExpiresAt(record)
      return expiresAt ? expiresAt.getTime() > Date.now() : nextAttempts < 20
    }
    return nextAttempts < 20
  }

  private getUserActionExpiresAt(record: PublishRecord): Date | undefined {
    const expiresAt = (record.dataOption as { expiresAt?: unknown } | undefined)?.expiresAt
    if (!(typeof expiresAt === 'string' || expiresAt instanceof Date)) {
      return undefined
    }
    const date = new Date(expiresAt)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  private buildPublishContent(record: PublishRecord): PublishContentInput {
    return {
      title: record.title,
      body: record.desc,
      media: [
        ...(record.videoUrl ? [{ url: record.videoUrl, metadata: { type: PublishMediaType.Video } }] : []),
        ...(record.imgUrlList || []).map(url => ({ url, metadata: { type: PublishMediaType.Image } })),
      ],
      cover: record.coverUrl ? { url: record.coverUrl } : undefined,
    }
  }

  private buildUpdateContent(record: PublishRecord): PublishContentInput {
    const pendingUpdate = record.pendingUpdate as PendingPublishUpdate | undefined
    return pendingUpdate?.content ?? this.buildPublishContent(record)
  }

  private getUpdateOption(record: PublishRecord): Record<string, unknown> | undefined {
    const pendingUpdate = record.pendingUpdate as PendingPublishUpdate | undefined
    if (pendingUpdate && 'option' in pendingUpdate) {
      return pendingUpdate.option
    }
    return record.option
  }

  private buildPendingUpdate(record: PublishRecord, updateData: PublishUpdateData, option?: Record<string, unknown>): PendingPublishUpdate & { content: PublishContentInput } {
    const currentContent = this.buildPublishContent(record)
    const contentInput = updateData.content ?? {}
    const media = Array.isArray(contentInput['media'])
      ? contentInput['media'].filter(this.isPublishMedia)
      : currentContent.media
    const coverInput = contentInput['cover']
    const content: PublishContentInput = {
      title: typeof contentInput['title'] === 'string' ? contentInput['title'] : currentContent.title,
      body: typeof contentInput['body'] === 'string' ? contentInput['body'] : currentContent.body,
      media,
      cover: coverInput === null
        ? undefined
        : (this.isPublishCover(coverInput) ? coverInput : currentContent.cover),
    }

    return {
      content,
      option,
    }
  }

  private getPendingMediaJobs(record: PublishRecord): PublishMediaJob[] {
    const mediaJobs = record.pendingMediaJobs
    if (!Array.isArray(mediaJobs)) {
      return []
    }
    return mediaJobs.filter(this.isPublishMediaJob)
  }

  private isPendingResult(strategy: CompletionStrategy, result: PublishProviderResult): boolean {
    return result.status === 102
      || result.status === 202
      || Boolean(result.mediaJobs?.length)
      || (strategy !== CompletionStrategy.Sync && result.status !== 200)
  }

  private isFailedResult(result: PublishProviderResult): boolean {
    return result.status >= 400
  }

  private getResultErrorMessage(result: PublishProviderResult): string {
    return result.errorMessage
      ?? getCodeMessage(ResponseCode.ChannelPublishPlatformStatusFailed, { status: result.status })
  }

  private getFinalizeDelayMs(platform: AccountType): number {
    return this.registry.get(platform).runtime.refreshWait ?? 30 * 1000
  }

  private isPublishMedia(value: unknown): value is { url: string, metadata?: Record<string, unknown> } {
    return Boolean(value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string')
  }

  private isPublishCover(value: unknown): value is { url: string, metadata?: Record<string, unknown> } {
    return this.isPublishMedia(value)
  }

  private isPublishMediaJob(value: unknown): value is PublishMediaJob {
    if (!value || typeof value !== 'object') {
      return false
    }
    const job = value as { mediaId?: unknown, type?: unknown, url?: unknown }
    return typeof job.mediaId === 'string'
      && (job.type === PublishMediaType.Image || job.type === PublishMediaType.Video)
      && typeof job.url === 'string'
  }

  private getScheduleWindow(platform: AccountType): number {
    return this.registry.get(platform).runtime.scheduleWindow ?? 24 * 60 * 60 * 1000
  }
}
