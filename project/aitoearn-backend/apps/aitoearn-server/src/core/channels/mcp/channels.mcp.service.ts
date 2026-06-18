import type {
  CallChannelEngagementFunctionParams,
  ChannelPlatformParams,
  ChannelPublishTaskParams,
  ChannelWorkParams,
  CreateChannelPublishFlowParams,
  GetChannelAccountAnalyticsParams,
  GetChannelPublishRecordByFlowIdParams,
  GetChannelPublishRecordByRecordIdParams,
  GetChannelPublishRecordByTaskIdParams,
  GetChannelWorkLinkInfoParams,
  ListBilibiliChannelPlatformCategoriesParams,
  ListChannelEngagementCommentsParams,
  ListChannelPublishRecordsParams,
  ListChannelWorksParams,
  ListYoutubeChannelPlatformCategoriesParams,
  RequestChannelPublishUpdateParams,
  SubmitChannelEngagementCommentParams,
  UpdateChannelPublishAtParams,
  VerifyChannelWorkOwnershipParams,
} from './channels-mcp.schema'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { PublishRecordSource } from '@yikart/mongodb'
import { AnalyticsService } from '../analytics/analytics.service'
import { EngagementService } from '../engagement/engagement.service'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { PlatformsService } from '../platforms/platforms.service'
import { PublishFlowService } from '../publish/flows/publish-flow.service'
import { PublishRecordReadService } from '../publish/records/publish-record-read.service'
import { PublishTaskService } from '../publish/tasks/publish-task.service'
import { WorkService } from '../works/work.service'

@Injectable()
export class ChannelsMcpService {
  constructor(
    private readonly publishFlowService: PublishFlowService,
    private readonly publishTaskService: PublishTaskService,
    private readonly recordReadService: PublishRecordReadService,
    private readonly analyticsService: AnalyticsService,
    private readonly engagementService: EngagementService,
    private readonly workService: WorkService,
    private readonly registry: PlatformIntegrationRegistry,
    private readonly platformsService: PlatformsService,
  ) {}

  async createChannelPublishFlow(userId: string, params: CreateChannelPublishFlowParams) {
    return this.publishFlowService.createFlow(userId, {
      ...params,
      context: {
        ...params.context,
        source: PublishRecordSource.Mcp,
      },
    })
  }

  async listChannelPublishRecords(userId: string, params: ListChannelPublishRecordsParams) {
    return this.recordReadService.listByUserId(userId, params)
  }

  async getChannelPublishRecordByRecordId(userId: string, params: GetChannelPublishRecordByRecordIdParams) {
    const record = await this.recordReadService.getDetail(params.recordId, userId)
    if (!record) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    return record
  }

  async getChannelPublishRecordByTaskId(userId: string, params: GetChannelPublishRecordByTaskIdParams) {
    return this.recordReadService.getByTaskId(userId, params.taskId)
  }

  async getChannelPublishRecordByFlowId(userId: string, params: GetChannelPublishRecordByFlowIdParams) {
    return this.recordReadService.getByFlowId(userId, params.flowId)
  }

  async publishChannelTaskNow(userId: string, params: ChannelPublishTaskParams) {
    await this.publishTaskService.publishNow(userId, params.taskId)
    return { taskId: params.taskId }
  }

  async cancelChannelPublishTask(userId: string, params: ChannelPublishTaskParams) {
    await this.publishTaskService.cancelTask(userId, params.taskId)
    return { taskId: params.taskId }
  }

  async updateChannelPublishAt(userId: string, params: UpdateChannelPublishAtParams) {
    await this.publishTaskService.updatePublishAt(userId, params.taskId, params.publishAt)
    return { taskId: params.taskId, publishAt: params.publishAt }
  }

  async requestChannelPublishUpdate(userId: string, params: RequestChannelPublishUpdateParams) {
    await this.publishTaskService.requestUpdate(userId, params.taskId, params.data)
    return { taskId: params.taskId }
  }

  async listChannelPlatforms() {
    return this.registry.listMetadata()
  }

  async getChannelPlatform(params: ChannelPlatformParams) {
    const platform = this.registry.listMetadata()
      .find(item => item.platform === params.platform)
    if (!platform) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform: params.platform })
    }
    return platform
  }

  async listBilibiliChannelPlatformCategories(userId: string, params: ListBilibiliChannelPlatformCategoriesParams) {
    return this.platformsService.getAccountValues(
      userId,
      params.accountId,
      'tid',
    )
  }

  async listYoutubeChannelPlatformCategories(userId: string, params: ListYoutubeChannelPlatformCategoriesParams) {
    return this.platformsService.getAccountValues(
      userId,
      params.accountId,
      'categoryId',
      {
        id: params.id,
        regionCode: params.regionCode,
      },
    )
  }

  async getChannelWorkLinkInfo(userId: string, params: GetChannelWorkLinkInfoParams) {
    return this.workService.getLinkInfo(userId, params.platform, params.link, params.accountId)
  }

  async listChannelWorks(userId: string, params: ListChannelWorksParams) {
    return this.workService.listWorks(userId, params.platform, params.accountId, params.pagination)
  }

  async getChannelWorkDetail(userId: string, params: ChannelWorkParams) {
    return this.workService.getDetail(userId, params.platform, params.platformWorkId, params.accountId)
  }

  async verifyChannelWorkOwnership(userId: string, params: VerifyChannelWorkOwnershipParams) {
    return this.workService.verifyOwnership(userId, params.platform, params.platformWorkId, params.candidateAccountId)
  }

  async getChannelAccountAnalytics(userId: string, params: GetChannelAccountAnalyticsParams) {
    return this.analyticsService.fetchAccountAnalytics(userId, params.accountId, {
      since: params.since,
      until: params.until,
    })
  }

  async getChannelWorkAnalytics(userId: string, params: ChannelWorkParams) {
    return this.analyticsService.fetchWorkAnalytics(userId, params.platform, params.platformWorkId, params.accountId)
  }

  async listChannelEngagementComments(userId: string, params: ListChannelEngagementCommentsParams) {
    return this.engagementService.listComments(userId, params.platform, params.platformWorkId, params.accountId, params.pagination)
  }

  async submitChannelEngagementComment(userId: string, params: SubmitChannelEngagementCommentParams) {
    return this.engagementService.createComment(
      userId,
      params.accountId,
      params.platform,
      params.platformWorkId,
      params.content,
      params.parentCommentId,
    )
  }

  async callChannelEngagementFunction(userId: string, params: CallChannelEngagementFunctionParams) {
    return this.engagementService.callFunction(userId, params.accountId, {
      platform: params.platform,
      name: params.name,
      data: params.data,
    })
  }
}
