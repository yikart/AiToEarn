import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { EngagementTaskStatus } from '@yikart/channel-db'
import { Job } from 'bullmq'
import { ChannelAccountService } from '../../platforms/channel-account.service'
import { EngagementProvider } from '../engagement.interface'
import { EngagementRecordService } from '../engagement.record.service'
import { FacebookEngagementProvider } from '../providers/facebook.provider'
import { InstagramEngagementProvider } from '../providers/instagram.provider'
import { ThreadsEngagementProvider } from '../providers/threads.provider'

@QueueProcessor(QueueName.EngagementReplyToComment, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class EngagementReplyToCommentConsumer extends WorkerHost {
  private readonly logger = new Logger(EngagementReplyToCommentConsumer.name)
  private readonly providerMap = new Map<string, EngagementProvider>()
  constructor(
    facebookProvider: FacebookEngagementProvider,
    instagramProvider: InstagramEngagementProvider,
    threadsProvider: ThreadsEngagementProvider,
    private readonly engagementRecordService: EngagementRecordService,
    private readonly channelAccountService: ChannelAccountService,
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

    // 安全检查：relay 账号任务不应到达队列消费者
    const account = await this.channelAccountService.getAccountInfo(subTask.accountId)
    if (account?.relayAccountRef) {
      this.logger.warn(`Relay account ${subTask.accountId} task reached engagement consumer, skipping sub task ${job.data.taskId}`)
      await this.engagementRecordService.updateEngagementSubTaskStatus(job.data.taskId, EngagementTaskStatus.FAILED)
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
}
