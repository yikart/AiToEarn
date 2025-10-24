import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { AitoearnAiClient, UserChatCompletionDto } from '@yikart/aitoearn-ai-client'
import { AppException, UserType } from '@yikart/common'
import { Queue } from 'bullmq'
import { EngagementTargetScope, EngagementTaskStatus, EngagementTaskType } from '../../libs/database/schema/engagement.task.schema'
import { ReplyToCommentAnswer } from './dto/ai.dto'
import { AIGenCommentDto, FetchCommentRepliesRequest, FetchPostCommentsRequest, PublishCommentReplyRequest, PublishCommentRequest, ReplyToCommentsDto } from './engagement.dto'
import { EngagementProvider, PublishCommentResponse } from './engagement.interface'
import { EngagementRecordService } from './engagement.record.service'
import { FacebookEngagementProvider } from './providers/facebook.provider'
import { InstagramEngagementProvider } from './providers/instagram.provider'
import { ThreadsEngagementProvider } from './providers/threads.provider'
import { YoutubeEngagementProvider } from './providers/youtube.provider'

@Injectable()
export class EngagementService {
  private readonly providerMap = new Map<string, EngagementProvider>()
  constructor(
    facebookProvider: FacebookEngagementProvider,
    instagramProvider: InstagramEngagementProvider,
    threadsProvider: ThreadsEngagementProvider,
    youtubeProvider: YoutubeEngagementProvider,
    private readonly aiClient: AitoearnAiClient,
    private readonly engagementRecordService: EngagementRecordService,
    @InjectQueue('engagement_task_distribution') private readonly distributeCommentTaskQ: Queue,
  ) {
    this.providerMap.set('facebook', facebookProvider)
    this.providerMap.set('instagram', instagramProvider)
    this.providerMap.set('threads', threadsProvider)
    this.providerMap.set('youtube', youtubeProvider)
  }

  private getProvider(providerKey: string): EngagementProvider {
    const provider = this.providerMap.get(providerKey)
    if (!provider) {
      throw new Error(`Engagement provider for ${providerKey} not found`)
    }
    return provider
  }

  async fetchPostComments(data: FetchPostCommentsRequest) {
    const provider = this.getProvider(data.platform)
    return provider.fetchPostComments(data.accountId, data.postId, data.pagination || null)
  }

  async fetchCommentReplies(data: FetchCommentRepliesRequest) {
    const provider = this.getProvider(data.platform)
    return provider.fetchCommentReplies(data.accountId, data.commentId, data.pagination || null)
  }

  async commentOnPost(data: PublishCommentRequest): Promise<PublishCommentResponse> {
    const provider = this.getProvider(data.platform)
    return provider.commentOnPost(data.accountId, data.postId, data.message)
  }

  async replyToComment(data: PublishCommentReplyRequest): Promise<PublishCommentResponse> {
    const provider = this.getProvider(data.platform)
    return provider.replyToComment(data.accountId, data.commentId, data.message)
  }

  async batchGenReplyContent(data: AIGenCommentDto): Promise<Record<string, string>> {
    const aiChatReq: UserChatCompletionDto = {
      userId: data.userId,
      userType: UserType.User,
      messages: [
        {
          role: 'system',
          content: 'You are a senior social media strategist.',
        },
        {
          role: 'user',
          content: 'I will provide you with a list of comments in the format: [{id: string, comment: string}].\n\nYour task:\n- Generate a professional and engaging reply for each comment\n- Keep replies concise and under 50 words\n- Maintain a positive and friendly tone, encouraging further interaction\n- The reply must be written in the same language as the comment\n- Return a strict JSON array, with each element formatted as: {id: string, comment: string, reply: string}\n\nImportant: The output must contain only the JSON array — no explanations, no extra text, and no code blocks.',
        },
        {
          role: 'user',
          content: JSON.stringify(data.comments),
        },
      ],
      model: data.model,
    }
    if (data.prompt && data.prompt.length > 0) {
      aiChatReq.messages.push({
        role: 'user',
        content: data.prompt,
      })
    }
    const resp = await this.aiClient.chatCompletion(aiChatReq)
    const replyMap: Record<string, string> = {}
    const replyList: ReplyToCommentAnswer[] = JSON.parse(resp.content as string)
    for (const replyItem of replyList) {
      replyMap[replyItem.id] = replyItem.reply
    }
    return replyMap
  }

  async ReplyToCommentsByAI(data: ReplyToCommentsDto): Promise<{ id: string }> {
    let targetScope = EngagementTargetScope.ALL
    if (data.comments?.length && data.comments.length > 0) {
      targetScope = EngagementTargetScope.PARTIAL
    }
    const tasks = await this.engagementRecordService.searchEngagementTaskInProgress(data.postId, EngagementTaskStatus.FAILED)
    if (tasks && tasks.length > 0) {
      throw new AppException(1, 'Reply task for this post is already in progress, please try again later.')
    }
    const task = await this.engagementRecordService.createEngagementTask({
      accountId: data.accountId,
      userId: data.userId,
      postId: data.postId,
      taskType: EngagementTaskType.REPLY,
      targetScope,
      prompt: data.prompt,
      model: data.model,
      platform: data.platform,
      targetIds: data.comments ? data.comments.map(c => c.id) : [],
      status: EngagementTaskStatus.CREATED,
      subTaskCount: 0,
      completedSubTaskCount: 0,
      failedSubTaskCount: 0,
    })
    if (data.comments && data.comments.length > 0) {
      for (const comment of data.comments) {
        await this.engagementRecordService.createEngagementSubTask({
          accountId: data.accountId,
          userId: data.userId,
          postId: data.postId,
          platform: data.platform,
          taskType: EngagementTaskType.REPLY,
          taskId: task.id,
          commentId: comment.id,
          commentContent: comment.comment,
          status: EngagementTaskStatus.CREATED,
          replyContent: '',
        })
      }
    }
    await this.distributeCommentTaskQ.add(
      `${task.platform}:engagement:task:${task.id}`,
      {
        taskId: task.id,
        attempts: 0,
      },
      {
        attempts: 0,
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
    return { id: task.id }
  }
}
