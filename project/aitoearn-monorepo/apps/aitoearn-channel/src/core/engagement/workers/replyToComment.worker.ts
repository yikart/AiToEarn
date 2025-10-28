import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, OnModuleDestroy } from '@nestjs/common'
import { Job } from 'bullmq'
import { EngagementTaskStatus } from '../../../libs/database/schema/engagement.task.schema'
import { EngagementProvider } from '../engagement.interface'
import { EngagementRecordService } from '../engagement.record.service'
import { FacebookEngagementProvider } from '../providers/facebook.provider'
import { InstagramEngagementProvider } from '../providers/instagram.provider'
import { ThreadsEngagementProvider } from '../providers/threads.provider'

@Processor('engagement_reply_to_comment_task', {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class EngagementReplyToCommentWorker extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(EngagementReplyToCommentWorker.name)
  private readonly providerMap = new Map<string, EngagementProvider>()
  constructor(
    facebookProvider: FacebookEngagementProvider,
    instagramProvider: InstagramEngagementProvider,
    threadsProvider: ThreadsEngagementProvider,
    private readonly engagementRecordService: EngagementRecordService,
  ) {
    super()
    this.providerMap.set('facebook', facebookProvider)
    this.providerMap.set('instagram', instagramProvider)
    this.providerMap.set('threads', threadsProvider)
  }

  private getProvider(providerKey: string): EngagementProvider {
    const provider = this.providerMap.get(providerKey)
    if (!provider) {
      throw new Error(`Engagement provider for ${providerKey} not found`)
    }
    return provider
  }

  async process(job: Job<{
    taskId: string
    attempts: number
  }>): Promise<any> {
    const subTask = await this.engagementRecordService.getEngagementSubTask(job.data.taskId)
    if (!subTask) {
      this.logger.error(`Sub task ${job.data.taskId} not found`)
      return
    }
    if (subTask.status === EngagementTaskStatus.CREATED) {
      const provider = this.getProvider(subTask.platform)
      const resp = await provider.replyToComment(subTask.accountId, subTask.commentId, subTask.replyContent)
      const status = resp.success ? EngagementTaskStatus.COMPLETED : EngagementTaskStatus.FAILED
      await this.engagementRecordService.updateEngagementSubTaskStatus(subTask.id, status)
      this.logger.log(`Sub task ${subTask.id} processed with status ${status}`)
      if (resp.success) {
        await this.engagementRecordService.incrementEngagementTaskCompletedSubTasks(subTask.taskId, 1)
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('PostPublishWorker is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('PostPublishWorker closed successfully')
  }
}
