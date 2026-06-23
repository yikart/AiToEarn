import type { z } from 'zod'
import { Injectable } from '@nestjs/common'
import { getUser, toYamlTextResult } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import { ChannelAccountAnalyticsVo, ChannelWorkAnalyticsVo } from '../analytics/analytics.vo'
import { ChannelCommentListVo, ChannelEngagementActionVo } from '../engagement/engagement.vo'
import { ChannelPublishRecordVo } from '../publish/records/publish-record.vo'
import { ChannelWorkDataVo, ChannelWorkListVo, ChannelWorkOwnershipVo } from '../works/works.vo'
import {
  CallChannelEngagementFunctionSchema,
  ChannelPlatformSchema,
  ChannelPublishTaskSchema,
  ChannelWorkSchema,
  CreateChannelPublishFlowSchema,
  GetChannelAccountAnalyticsSchema,
  GetChannelPublishRecordByFlowIdSchema,
  GetChannelPublishRecordByRecordIdSchema,
  GetChannelPublishRecordByTaskIdSchema,
  GetChannelWorkLinkInfoSchema,
  ListBilibiliChannelPlatformCategoriesSchema,
  ListChannelEngagementCommentsSchema,
  ListChannelPublishRecordsSchema,
  ListChannelWorksSchema,
  ListYoutubeChannelPlatformCategoriesSchema,
  RequestChannelPublishUpdateSchema,
  SubmitChannelEngagementCommentSchema,
  UpdateChannelPublishAtSchema,
  VerifyChannelWorkOwnershipSchema,
} from './channels-mcp.schema'
import { ChannelsMcpService } from './channels.mcp.service'

@Injectable()
export class ChannelsMcpController {
  constructor(private readonly channelsMcpService: ChannelsMcpService) {}

  @Tool({
    name: 'createChannelPublishFlow',
    description: 'Create a channels publish flow with the v2 channels input shape. Side Effect: yes.',
    parameters: CreateChannelPublishFlowSchema,
  })
  async createChannelPublishFlow(params: z.infer<typeof CreateChannelPublishFlowSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.createChannelPublishFlow(user.id, params))
  }

  @Tool({
    name: 'listChannelPublishRecords',
    description: 'List channels publish records for the authenticated user.',
    parameters: ListChannelPublishRecordsSchema,
  })
  async listChannelPublishRecords(params: z.infer<typeof ListChannelPublishRecordsSchema>) {
    const user = getUser()
    const records = await this.channelsMcpService.listChannelPublishRecords(user.id, params)
    return toYamlTextResult(
      records.map(record => ChannelPublishRecordVo.create(record)),
    )
  }

  @Tool({
    name: 'getChannelPublishRecordByRecordId',
    description: 'Get one channels publish record by recordId.',
    parameters: GetChannelPublishRecordByRecordIdSchema,
  })
  async getChannelPublishRecordByRecordId(params: z.infer<typeof GetChannelPublishRecordByRecordIdSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelPublishRecordVo.create(await this.channelsMcpService.getChannelPublishRecordByRecordId(user.id, params)),
    )
  }

  @Tool({
    name: 'getChannelPublishRecordByTaskId',
    description: 'Get one channels publish record by taskId.',
    parameters: GetChannelPublishRecordByTaskIdSchema,
  })
  async getChannelPublishRecordByTaskId(params: z.infer<typeof GetChannelPublishRecordByTaskIdSchema>) {
    const user = getUser()
    const record = await this.channelsMcpService.getChannelPublishRecordByTaskId(user.id, params)
    return toYamlTextResult(record ? ChannelPublishRecordVo.create(record) : null)
  }

  @Tool({
    name: 'getChannelPublishRecordByFlowId',
    description: 'Get one channels publish record by flowId.',
    parameters: GetChannelPublishRecordByFlowIdSchema,
  })
  async getChannelPublishRecordByFlowId(params: z.infer<typeof GetChannelPublishRecordByFlowIdSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelPublishRecordVo.create(await this.channelsMcpService.getChannelPublishRecordByFlowId(user.id, params)),
    )
  }

  @Tool({
    name: 'publishChannelTaskNow',
    description: 'Publish a channels task immediately. Side Effect: yes.',
    parameters: ChannelPublishTaskSchema,
  })
  async publishChannelTaskNow(params: z.infer<typeof ChannelPublishTaskSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.publishChannelTaskNow(user.id, params))
  }

  @Tool({
    name: 'cancelChannelPublishTask',
    description: 'Cancel a channels publish task. Side Effect: yes.',
    parameters: ChannelPublishTaskSchema,
  })
  async cancelChannelPublishTask(params: z.infer<typeof ChannelPublishTaskSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.cancelChannelPublishTask(user.id, params))
  }

  @Tool({
    name: 'updateChannelPublishAt',
    description: 'Update a channels publish task publish time. Side Effect: yes.',
    parameters: UpdateChannelPublishAtSchema,
  })
  async updateChannelPublishAt(params: z.infer<typeof UpdateChannelPublishAtSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.updateChannelPublishAt(user.id, params))
  }

  @Tool({
    name: 'requestChannelPublishUpdate',
    description: 'Request an update for a published channels task using the v2 update data shape. Side Effect: yes.',
    parameters: RequestChannelPublishUpdateSchema,
  })
  async requestChannelPublishUpdate(params: z.infer<typeof RequestChannelPublishUpdateSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.requestChannelPublishUpdate(user.id, params))
  }

  @Tool({
    name: 'listChannelPlatforms',
    description: 'List channels platform metadata, capabilities, publish limits, and option schemas.',
    parameters: undefined,
  })
  async listChannelPlatforms() {
    return toYamlTextResult(await this.channelsMcpService.listChannelPlatforms())
  }

  @Tool({
    name: 'getChannelPlatform',
    description: 'Get one channels platform metadata entry.',
    parameters: ChannelPlatformSchema,
  })
  async getChannelPlatform(params: z.infer<typeof ChannelPlatformSchema>) {
    return toYamlTextResult(await this.channelsMcpService.getChannelPlatform(params))
  }

  @Tool({
    name: 'listBilibiliChannelPlatformCategories',
    description: 'List Bilibili content categories currently supported by channels MCP.',
    parameters: ListBilibiliChannelPlatformCategoriesSchema,
  })
  async listBilibiliChannelPlatformCategories(params: z.infer<typeof ListBilibiliChannelPlatformCategoriesSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.listBilibiliChannelPlatformCategories(user.id, params))
  }

  @Tool({
    name: 'listYoutubeChannelPlatformCategories',
    description: 'List YouTube content categories currently supported by channels MCP.',
    parameters: ListYoutubeChannelPlatformCategoriesSchema,
  })
  async listYoutubeChannelPlatformCategories(params: z.infer<typeof ListYoutubeChannelPlatformCategoriesSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.channelsMcpService.listYoutubeChannelPlatformCategories(user.id, params))
  }

  @Tool({
    name: 'getChannelWorkLinkInfo',
    description: 'Resolve a work link through the channels work provider.',
    parameters: GetChannelWorkLinkInfoSchema,
  })
  async getChannelWorkLinkInfo(params: z.infer<typeof GetChannelWorkLinkInfoSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelWorkDataVo.create(await this.channelsMcpService.getChannelWorkLinkInfo(user.id, params)),
    )
  }

  @Tool({
    name: 'listChannelWorks',
    description: 'List works for a platform account through the channels work provider.',
    parameters: ListChannelWorksSchema,
  })
  async listChannelWorks(params: z.infer<typeof ListChannelWorksSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelWorkListVo.create(await this.channelsMcpService.listChannelWorks(user.id, params)),
    )
  }

  @Tool({
    name: 'getChannelWorkDetail',
    description: 'Get a platform work detail through the channels work provider.',
    parameters: ChannelWorkSchema,
  })
  async getChannelWorkDetail(params: z.infer<typeof ChannelWorkSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelWorkDataVo.create(await this.channelsMcpService.getChannelWorkDetail(user.id, params)),
    )
  }

  @Tool({
    name: 'verifyChannelWorkOwnership',
    description: 'Verify whether a platform work belongs to a candidate channels account.',
    parameters: VerifyChannelWorkOwnershipSchema,
  })
  async verifyChannelWorkOwnership(params: z.infer<typeof VerifyChannelWorkOwnershipSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelWorkOwnershipVo.create(await this.channelsMcpService.verifyChannelWorkOwnership(user.id, params)),
    )
  }

  @Tool({
    name: 'getChannelAccountAnalytics',
    description: 'Get channels account analytics through the platform analytics provider.',
    parameters: GetChannelAccountAnalyticsSchema,
  })
  async getChannelAccountAnalytics(params: z.infer<typeof GetChannelAccountAnalyticsSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelAccountAnalyticsVo.create(await this.channelsMcpService.getChannelAccountAnalytics(user.id, params)),
    )
  }

  @Tool({
    name: 'getChannelWorkAnalytics',
    description: 'Get channels work analytics through the platform analytics provider.',
    parameters: ChannelWorkSchema,
  })
  async getChannelWorkAnalytics(params: z.infer<typeof ChannelWorkSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelWorkAnalyticsVo.create(await this.channelsMcpService.getChannelWorkAnalytics(user.id, params)),
    )
  }

  @Tool({
    name: 'listChannelEngagementComments',
    description: 'List comments for a platform work through the channels engagement provider.',
    parameters: ListChannelEngagementCommentsSchema,
  })
  async listChannelEngagementComments(params: z.infer<typeof ListChannelEngagementCommentsSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelCommentListVo.create(await this.channelsMcpService.listChannelEngagementComments(user.id, params)),
    )
  }

  @Tool({
    name: 'submitChannelEngagementComment',
    description: 'Create a comment for a platform work through the channels engagement provider. Side Effect: yes.',
    parameters: SubmitChannelEngagementCommentSchema,
  })
  async submitChannelEngagementComment(params: z.infer<typeof SubmitChannelEngagementCommentSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelEngagementActionVo.create(await this.channelsMcpService.submitChannelEngagementComment(user.id, params)),
    )
  }

  @Tool({
    name: 'callChannelEngagementFunction',
    description: 'Call a channels engagement function. Side Effect: yes. data fields: delete_comment/hide_reply/unhide_reply use commentId; like/unlike/repost/undo_repost/bookmark/remove_bookmark use platformWorkId; quote uses platformWorkId and content; follow/unfollow use targetPlatformUid.',
    parameters: CallChannelEngagementFunctionSchema,
  })
  async callChannelEngagementFunction(params: z.infer<typeof CallChannelEngagementFunctionSchema>) {
    const user = getUser()
    return toYamlTextResult(
      ChannelEngagementActionVo.create(await this.channelsMcpService.callChannelEngagementFunction(user.id, params)),
    )
  }
}
