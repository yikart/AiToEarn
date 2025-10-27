import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, OnModuleDestroy } from '@nestjs/common'
import { Job, Queue } from 'bullmq'
import { EngagementSubTask, EngagementTask, EngagementTaskStatus, EngagementTaskType } from '../../../libs/database/schema/engagement.task.schema'
import { AIGenCommentDto, Comment, FetchPostCommentsRequest, KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementRecordService } from '../engagement.record.service'
import { EngagementService } from '../engagement.service'

@Processor('engagement_task_distribution', {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class EngagementTaskDistributionWorker extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(EngagementTaskDistributionWorker.name)
  constructor(
    private readonly engagementRecordService: EngagementRecordService,
    private readonly engagementService: EngagementService,
    @InjectQueue('engagement_reply_to_comment_task') private readonly replyToCommentQ: Queue,
  ) {
    super()
  }

  private async publish(task: EngagementSubTask) {
    await this.replyToCommentQ.add(
      `${task.platform}:reply_to_comment:task:${task.id}`,
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
  }

  private async distributePartialCommentsTask(task: EngagementTask) {
    const subTasks = await this.engagementRecordService.queryEngagementSubTasksByTaskId(task.id)
    let taskPublishedCount = 0
    try {
      const comments: Comment[] = []
      for (const subTask of subTasks) {
        comments.push({ id: subTask.commentId, comment: subTask.commentContent })
      }
      const data: AIGenCommentDto = {
        userId: task.userId,
        comments,
        model: task.model,
        prompt: task.prompt || '',
      }
      const resp = await this.engagementService.batchGenReplyContent(data)
      for (const subTask of subTasks) {
        const replyContent = resp[subTask.commentId]
        if (replyContent && replyContent.length > 0) {
          await this.engagementRecordService.updateEngagementSubTask(subTask.id, { replyContent })
          await this.publish(subTask)
          taskPublishedCount += 1
        }
        else {
          this.logger.warn(`[task-${task.id}] No reply content generated for comment ${subTask.commentId}`)
        }
      }
      await this.engagementRecordService.updateEngagementTaskStatus(task.id, EngagementTaskStatus.DISTRIBUTED)
    }
    catch (error) {
      this.logger.error(`[task-${task.id}] Failed to distribute comments task: ${error.message}`)
      const status = taskPublishedCount > 0 ? EngagementTaskStatus.DISTRIBUTED : EngagementTaskStatus.FAILED
      await this.engagementRecordService.updateEngagementTaskStatus(task.id, status)
    }
  }

  private async distributeAllCommentsTask(task: EngagementTask) {
    let taskPublishedCount = 0
    try {
      let pagination: KeysetPagination | OffsetPagination | null = null
      while (true) {
        const req: FetchPostCommentsRequest = {
          accountId: task.accountId,
          postId: task.postId,
          platform: task.platform as any,
          pagination,
        }
        const resp = await this.engagementService.fetchPostComments(req)
        if (resp.comments.length === 0) {
          break
        }
        const comments: Comment[] = []
        for (const comment of resp.comments) {
          comments.push({ id: comment.id, comment: comment.message })
        }
        const data: AIGenCommentDto = {
          userId: task.userId,
          comments,
          model: task.model,
          prompt: task.prompt || '',
        }
        const aiResp = await this.engagementService.batchGenReplyContent(data)
        for (const comment of resp.comments) {
          const replyContent = aiResp[comment.id]
          const existingSubTasks = await this.engagementRecordService.searchEngagementSubTasksByCommentId(task.postId, comment.id, EngagementTaskStatus.COMPLETED)
          if (existingSubTasks && existingSubTasks.length > 0) {
            this.logger.warn(`[task-${task.id}] Skip creating sub-task for comment ${comment.id} as it already has a completed sub-task.`)
            continue
          }
          const subTask = await this.engagementRecordService.createEngagementSubTask({
            accountId: task.accountId,
            userId: task.userId,
            postId: task.postId,
            platform: task.platform,
            taskType: EngagementTaskType.REPLY,
            taskId: task.id,
            commentId: comment.id,
            commentContent: comment.message,
            status: EngagementTaskStatus.CREATED,
            replyContent,
          })
          await this.publish(subTask)
          taskPublishedCount += 1
        }
        await this.engagementRecordService.incrementEngagementTaskTotalSubTasks(task.id, resp.comments.length)
        pagination = resp.cursor
        if (pagination && pagination.before) {
          pagination.before = ''
        }
      }
      await this.engagementRecordService.updateEngagementTaskStatus(task.id, EngagementTaskStatus.DISTRIBUTED)
    }
    catch (error) {
      this.logger.error(`[task-${task.id}] Failed to distribute comments task: ${error.message}`)
      const status = taskPublishedCount > 0 ? EngagementTaskStatus.DISTRIBUTED : EngagementTaskStatus.FAILED
      await this.engagementRecordService.updateEngagementTaskStatus(task.id, status)
    }
  }

  async process(job: Job<{
    taskId: string
    attempts: number
  }>): Promise<any> {
    const task = await this.engagementRecordService.getEngagementTask(job.data.taskId)
    if (!task) {
      this.logger.error(`[task-${job.data.taskId}] Engagement task not found: ${job.data.taskId}`)
      return
    }
    this.logger.log(`[task-${job.data.taskId}] Processing Engagement Task: ${job.data.taskId} for platform ${task.platform}`)
    try {
      if (task.targetScope === 'PARTIAL' && task.targetIds && task.targetIds.length > 0) {
        await this.distributePartialCommentsTask(task)
      }
      else if (task.targetScope === 'ALL') {
        await this.distributeAllCommentsTask(task)
      }
      else {
        this.logger.warn(`[task-${job.data.taskId}] No target IDs provided for PARTIAL scope task.`)
        await this.engagementRecordService.updateEngagementTaskStatus(task.id, EngagementTaskStatus.FAILED)
      }
    }
    catch (error) {
      this.logger.error(`[task-${job.data.taskId}] Error processing job ${job.id}: ${error.message}`, error.stack)
      throw new Error(`[task-${job.data.taskId}] Job ${job.id} failed: ${error.message}`)
    }
  }

  async onModuleDestroy() {
    this.logger.log('PostPublishWorker is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('PostPublishWorker closed successfully')
  }
}
