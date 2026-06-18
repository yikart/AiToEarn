import type { AccountType } from '@yikart/common'
import type { PublishMediaPreparationCache } from '../../media/media.service'
import type { PlatformIntegration, PlatformMediaRules, PublishProviderResult } from '../../platforms/platforms.interface'
import type { PublishValidationIssue } from '../../platforms/publish.schema'
import type { PublishContentInput } from '../schemas/publish-content.schema'
import type { CreatePublishFlowCommand } from './publish-flow.dto'
import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, getLocale, ResponseCode } from '@yikart/common'
import { AccountRepository, PublishRecordLinkStatus, PublishRecordRepository, PublishStatus, PublishType, Transactional } from '@yikart/mongodb'
import { RelayAccountException } from '../../../relay/relay-account.exception'
import { MediaService } from '../../media/media.service'
import { AuthType, PublishMediaType } from '../../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../../platforms/platforms.registry'
import { formatPublishValidationIssue, parseTopicsFromBody, PublishValidationField, PublishValidationIssueCode } from '../../platforms/publish.schema'
import { validatePublishContent } from '../../utils/publish-content.utils'
import { PublishQueueService } from '../tasks/publish-queue.service'
import { PublishStateService } from '../tasks/publish-state.service'

interface PublishFlowAccount {
  uid?: string
  account?: string
  relayAccountRef?: string | null
}

interface PreparedPublishFlowRecord {
  item: CreatePublishFlowCommand['items'][number]
  account?: PublishFlowAccount
  content: PublishContentInput
  type: PublishType
  media: { videoUrl?: string, imgUrlList?: string[] }
  option?: Record<string, unknown>
  completedResult?: PublishProviderResult
  completedAt?: Date
}

interface CreatedPublishFlowRecords {
  resultRecords: Array<{ id: string, platform: AccountType, accountId: string }>
  queueRecords: Array<{ id: string, platform: AccountType }>
}

@Injectable()
export class PublishFlowService {
  private readonly logger = new Logger(PublishFlowService.name)

  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly accountRepo: AccountRepository,
    private readonly registry: PlatformIntegrationRegistry,
    private readonly mediaService: MediaService,
    private readonly stateService: PublishStateService,
    private readonly queueService: PublishQueueService,
  ) {}

  async createFlow(userId: string, dto: CreatePublishFlowCommand) {
    const flowId = dto.flowId ?? randomUUID()
    const items = dto.items

    // Deduplicate: reject duplicate accountId + platform
    const seen = new Set<string>()
    for (const item of items) {
      const key = `${item.accountId}:${item.platform}`
      if (seen.has(key)) {
        throw new AppException(ResponseCode.ChannelPublishDuplicateItem, {
          accountId: item.accountId,
          platform: item.platform,
        })
      }
      seen.add(key)
    }

    const { resultRecords, queueRecords } = await this.createFlowRecords(userId, dto, flowId, items)
    await this.enqueueQueuedRecords(queueRecords, dto.publishAt)

    return { flowId, tasks: resultRecords }
  }

  @Transactional()
  private async createFlowRecords(
    userId: string,
    dto: CreatePublishFlowCommand,
    flowId: string,
    items: CreatePublishFlowCommand['items'],
  ): Promise<CreatedPublishFlowRecords> {
    const existingTasks = await this.publishRecordRepo.listByFlowIdAndUserId(flowId, userId)
    if (existingTasks.length) {
      throw new AppException(ResponseCode.ChannelPublishTaskAlreadyExists, { flowId })
    }

    // Verify account ownership before any provider call.
    const accounts = new Map<string, PublishFlowAccount>()
    const relayAccountIdMap = new Map<string, string>()
    let localAccountCount = 0
    for (const item of items) {
      const platform = item.platform
      const account = await this.accountRepo.getByIdAndUserId(item.accountId, userId)
      if (!account || account.type !== platform) {
        throw new AppException(ResponseCode.ChannelAccountNotFound)
      }
      accounts.set(`${item.accountId}:${platform}`, account)
      if (account.relayAccountRef) {
        relayAccountIdMap.set(item.accountId, account.relayAccountRef)
      }
      else {
        localAccountCount++
      }
    }

    if (relayAccountIdMap.size > 0) {
      if (localAccountCount > 0) {
        throw new AppException(ResponseCode.ChannelPublishMixedRelayAndLocalAccounts)
      }
      const firstRelayAccount = relayAccountIdMap.entries().next().value
      if (!firstRelayAccount) {
        throw new AppException(ResponseCode.ChannelAccountNotFound)
      }
      const [originalAccountId, relayAccountRef] = firstRelayAccount
      throw new RelayAccountException(relayAccountRef, originalAccountId, relayAccountIdMap)
    }

    // Pre-validate and prepare all items before provider-side publish effects.
    const mediaPreparationCache: PublishMediaPreparationCache = new Map()
    const preparedRecords: PreparedPublishFlowRecord[] = []
    for (const item of items) {
      const integration = this.registry.get(item.platform)
      if (!integration.publish || !integration.metadata.publishPolicy) {
        throw new AppException(ResponseCode.ChannelPublishPlatformNotSupported, { platform: item.platform })
      }
      const content = this.mergeContent(dto.content, item.overrides)
      const mediaRules = this.resolveMediaRules(integration, item.platform, item.accountId, content, item.option)
      const allIssues: PublishValidationIssue[] = []
      const preparedMedia = await this.mediaService.preparePublishContentMedia({
        userId,
        content,
        mediaRules,
        mediaPolicy: integration.runtime.media,
        cache: mediaPreparationCache,
      })
      allIssues.push(...preparedMedia.issues)
      const preparedContent = preparedMedia.issues.length ? content : preparedMedia.content

      // Step 1: common content validation
      if (allIssues.length === 0) {
        const contentIssues = validatePublishContent(
          preparedContent,
          integration.metadata.contentLimits,
          integration.metadata.topic,
        )
        allIssues.push(
          ...(integration.metadata.authType === AuthType.Plugin
            ? contentIssues.filter(issue =>
                issue.code !== PublishValidationIssueCode.Required
                || issue.params?.['field'] !== PublishValidationField.Post,
              )
            : contentIssues),
        )
      }

      // Step 2: platform-specific validation (only if step 1 passed)
      if (allIssues.length === 0) {
        const validation = await integration.publish.validate({
          platform: item.platform,
          accountId: item.accountId,
          content: preparedContent,
          option: item.option,
        })
        if (validation.issues)
          allIssues.push(...validation.issues)
      }

      // Step 3: media probe + validation (only if step 1+2 passed)
      if (allIssues.length === 0) {
        const finalMediaRules = this.resolveMediaRules(integration, item.platform, item.accountId, preparedContent, item.option)
        const mediaIssues = await this.mediaService.validateMedia(preparedContent, finalMediaRules)
        allIssues.push(...mediaIssues)
      }

      if (allIssues.length > 0) {
        this.throwValidationFailed(item.platform, item.accountId, allIssues)
      }

      const account = accounts.get(`${item.accountId}:${item.platform}`)
      const type = this.resolvePublishType(preparedContent, dto.context)
      const media = this.resolveRecordMedia(preparedContent, dto.context, type)
      preparedRecords.push({
        item,
        account,
        content: preparedContent,
        option: item.option,
        type,
        media,
      })
    }

    for (const prepared of preparedRecords) {
      const { item, account, content, option } = prepared
      const integration = this.registry.get(item.platform)
      if (!integration.publish || !integration.metadata.publishPolicy) {
        throw new AppException(ResponseCode.ChannelPublishPlatformNotSupported, { platform: item.platform })
      }
      const completedResult = integration.metadata.authType === AuthType.Plugin
        ? await integration.publish.publish({
            taskId: `${flowId}_${item.platform}_${item.accountId}`,
            platform: item.platform,
            accountId: item.accountId,
            content,
            option,
            publishAt: dto.publishAt,
            credential: {
              accessToken: '',
              platformUid: account?.uid,
              account: account?.account,
            },
          })
        : undefined

      if (completedResult && completedResult.status !== 200) {
        throw new AppException(ResponseCode.ChannelPublishPlatformStatusFailed, { status: completedResult.status })
      }
      if (completedResult && !completedResult.platformWorkId) {
        throw new AppException(ResponseCode.ChannelPublishPlatformWorkIdMissing)
      }
      if (completedResult && !completedResult.permalink && completedResult.linkStatus !== PublishRecordLinkStatus.PENDING) {
        throw new AppException(ResponseCode.ChannelPublishPermalinkMissing)
      }

      const completedAt = completedResult ? new Date() : undefined
      prepared.completedResult = completedResult
      prepared.completedAt = completedAt
    }

    const records: Array<{
      id: string
      platform: AccountType
      accountId: string
      status: PublishStatus
      publishTime?: Date
      platformWorkId?: string
      workLink?: string
      linkStatus?: PublishRecordLinkStatus
      linkError?: string
      linkMeta?: Record<string, unknown>
      completedResult?: PublishProviderResult
      completedAt?: Date
    }> = []
    const queueRecords: Array<{ id: string, platform: AccountType }> = []
    for (const prepared of preparedRecords) {
      const { item, account, content, type, media, option, completedResult, completedAt } = prepared
      const record = await this.publishRecordRepo.create({
        userId,
        flowId,
        taskId: dto.context?.taskId,
        materialGroupId: dto.context?.materialGroupId,
        materialId: dto.context?.materialId,
        accountId: item.accountId,
        accountType: item.platform,
        uid: account?.uid,
        type,
        status: completedResult ? PublishStatus.Published : PublishStatus.WaitingForPublish,
        title: content.title,
        desc: content.body,
        topics: parseTopicsFromBody(content.body),
        publishTime: completedAt ?? dto.publishAt,
        source: dto.context?.source,
        option,
        videoUrl: media.videoUrl,
        imgUrlList: media.imgUrlList,
        coverUrl: content.cover?.url,
        platformWorkId: completedResult?.platformWorkId,
        dataId: completedResult?.platformWorkId,
        uniqueId: completedResult?.platformWorkId ? `${item.platform}_${completedResult.platformWorkId}` : undefined,
        workLink: completedResult?.permalink,
        originalWorkLink: completedResult?.originalWorkLink,
        workStatus: completedResult?.workStatus,
        linkStatus: completedResult?.linkStatus,
        linkMeta: completedResult?.linkMeta,
        dataOption: completedResult?.dataOption,
      })

      records.push({
        id: record.id,
        platform: item.platform,
        accountId: item.accountId,
        status: record.status,
        publishTime: record.publishTime,
        platformWorkId: record.platformWorkId,
        workLink: record.workLink,
        linkStatus: record.linkStatus,
        linkError: record.linkError,
        linkMeta: record.linkMeta,
        completedResult,
        completedAt,
      })
    }

    const resultRecords: Array<{
      id: string
      platform: AccountType
      accountId: string
      status: PublishStatus
      publishTime?: Date
      platformWorkId?: string
      workLink?: string
      linkStatus?: PublishRecordLinkStatus
      linkError?: string
      linkMeta?: Record<string, unknown>
    }> = []
    for (const record of records) {
      resultRecords.push({
        id: record.id,
        platform: record.platform,
        accountId: record.accountId,
        status: record.status,
        publishTime: record.publishTime,
        platformWorkId: record.platformWorkId,
        workLink: record.workLink,
        linkStatus: record.linkStatus,
        linkError: record.linkError,
        linkMeta: record.linkMeta,
      })
      await this.stateService.markCreated({
        id: record.id,
        userId,
        flowId,
        accountId: record.accountId,
        accountType: record.platform,
      })
      if (record.completedResult) {
        await this.stateService.markCreatedPublished(record.id, {
          platformWorkId: record.completedResult.platformWorkId,
          permalink: record.completedResult.permalink,
          publishAt: record.completedAt,
          dataOption: record.completedResult.dataOption,
          originalWorkLink: record.completedResult.originalWorkLink,
          workStatus: record.completedResult.workStatus,
        })
      }
      else {
        queueRecords.push({ id: record.id, platform: record.platform })
      }
    }

    return { resultRecords, queueRecords }
  }

  private resolveMediaRules(
    integration: PlatformIntegration,
    platform: AccountType,
    accountId: string,
    content: PublishContentInput,
    option?: Record<string, unknown>,
  ): PlatformMediaRules {
    return integration.publish?.resolveMediaRules?.({
      platform,
      accountId,
      content,
      option,
    }) ?? integration.metadata.mediaRules
  }

  private throwValidationFailed(platform: AccountType, accountId: string, issues: PublishValidationIssue[]): never {
    const locale = getLocale()
    throw new AppException(ResponseCode.ChannelPublishValidationFailed, {
      platform,
      accountId,
      issues: issues.map(issue => formatPublishValidationIssue(issue, locale)),
    })
  }

  private async enqueueQueuedRecords(
    queueRecords: Array<{ id: string, platform: AccountType }>,
    publishAtInput: Date,
  ): Promise<void> {
    const now = new Date()
    const publishAt = new Date(publishAtInput)
    const diffMs = publishAt.getTime() - now.getTime()

    for (const record of queueRecords) {
      const scheduleWindow = this.getScheduleWindow(record.platform)
      if (diffMs <= 0) {
        const queued = await this.stateService.markQueued(record.id)
        if (queued) {
          try {
            await this.queueService.enqueueImmediate(record.id)
          }
          catch (err) {
            await this.stateService.restoreQueuedToWaiting(record.id)
            this.logger.error(err, `Publish flow enqueue failed for task ${record.id}`)
          }
        }
      }
      else if (diffMs <= scheduleWindow) {
        const queued = await this.stateService.markQueued(record.id)
        if (queued) {
          try {
            await this.queueService.enqueueDelayed(record.id, diffMs)
          }
          catch (err) {
            await this.stateService.restoreQueuedToWaiting(record.id)
            this.logger.error(err, `Publish flow enqueue failed for task ${record.id}`)
          }
        }
      }
    }
  }

  async getFlowDetail(userId: string, flowId: string) {
    const tasks = await this.publishRecordRepo.listByFlowIdAndUserId(flowId, userId)
    if (!tasks.length) {
      throw new AppException(ResponseCode.PublishFlowNotFound)
    }

    return {
      flowId,
      tasks: tasks.map(t => ({
        id: t.id,
        accountId: t.accountId,
        platform: t.accountType,
        status: t.status,
        publishTime: t.publishTime,
        platformWorkId: t.platformWorkId,
        workLink: t.workLink,
        linkStatus: t.linkStatus,
        linkError: t.linkError,
        linkMeta: t.linkMeta,
        errorMsg: t.errorMsg,
      })),
    }
  }

  private mergeContent(content: CreatePublishFlowCommand['content'], overrides?: CreatePublishFlowCommand['items'][0]['overrides']) {
    if (!overrides)
      return content

    return {
      title: overrides.title ?? content.title,
      body: overrides.body ?? content.body,
      media: overrides.media ?? content.media,
      cover: overrides.cover === null ? undefined : (overrides.cover ?? content.cover),
    }
  }

  private resolvePublishType(
    content: PublishContentInput,
    context?: CreatePublishFlowCommand['context'],
  ): PublishType {
    if (context?.type) {
      return context.type
    }
    if (context?.videoUrl || content.media.some(media => this.isVideoMedia(media))) {
      return PublishType.VIDEO
    }
    return PublishType.ARTICLE
  }

  private resolveRecordMedia(
    content: PublishContentInput,
    context: CreatePublishFlowCommand['context'],
    type: PublishType,
  ): { videoUrl?: string, imgUrlList?: string[] } {
    if (context?.videoUrl || context?.imgUrlList) {
      return {
        videoUrl: context.videoUrl,
        imgUrlList: context.imgUrlList,
      }
    }

    if (type === PublishType.VIDEO) {
      return {
        videoUrl: content.media.find(media => this.isVideoMedia(media))?.url ?? content.media[0]?.url,
        imgUrlList: [],
      }
    }

    return {
      imgUrlList: content.media.map(media => media.url),
    }
  }

  private isVideoUrl(url: string): boolean {
    const pathname = this.getUrlPathname(url).toLowerCase()
    return ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'].some(extension => pathname.endsWith(extension))
  }

  private isVideoMedia(media: PublishContentInput['media'][number]): boolean {
    const metadataType = media.metadata?.['type']
    if (metadataType === PublishMediaType.Video) {
      return true
    }
    if (metadataType === PublishMediaType.Image) {
      return false
    }
    return this.isVideoUrl(media.url)
  }

  private getUrlPathname(url: string): string {
    try {
      return new URL(url).pathname
    }
    catch {
      return url
    }
  }

  private getScheduleWindow(platform: AccountType): number {
    return this.registry.get(platform).runtime.scheduleWindow ?? 24 * 60 * 60 * 1000
  }
}
