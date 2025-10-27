import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AitoearnAiClientModule } from '@yikart/aitoearn-ai-client'
import { EngagementSubTask, EngagementSubTaskSchema, EngagementTask, EngagementTaskSchema } from '../../libs/database/schema/engagement.task.schema'
import { AIInternalApi } from '../../transports/ai/ai.api'
import { TransportModule } from '../../transports/transport.module'
import { MetaModule } from '../plat/meta/meta.module'
import { YoutubeModule } from '../plat/youtube/youtube.module'
import { EngagementController } from './engagement.controller'
import { EngagementRecordService } from './engagement.record.service'
import { EngagementService } from './engagement.service'
import { FacebookEngagementProvider } from './providers/facebook.provider'
import { InstagramEngagementProvider } from './providers/instagram.provider'
import { ThreadsEngagementProvider } from './providers/threads.provider'
import { YoutubeEngagementProvider } from './providers/youtube.provider'
import { EngagementTaskDistributionWorker } from './workers/distributeEngatementTask.worker'
import { EngagementReplyToCommentWorker } from './workers/replyToComment.worker'

@Module({
  imports: [
    MetaModule,
    YoutubeModule,
    BullModule.registerQueue({
      name: 'engagement_task_distribution',
      defaultJobOptions: {
        // delay: 60000, // 60 seconds
        removeOnComplete: true,
      },
    }),
    BullModule.registerQueue({
      name: 'engagement_reply_to_comment_task',
      defaultJobOptions: {
        // delay: 60000, // 60 seconds
        removeOnComplete: true,
      },
    }),
    MongooseModule.forFeature([
      { name: EngagementTask.name, schema: EngagementTaskSchema },
      { name: EngagementSubTask.name, schema: EngagementSubTaskSchema },
    ]),
    AitoearnAiClientModule.forRoot({}),
    TransportModule,
  ],
  controllers: [EngagementController],
  providers: [
    AIInternalApi,
    FacebookEngagementProvider,
    InstagramEngagementProvider,
    ThreadsEngagementProvider,
    YoutubeEngagementProvider,
    EngagementService,
    EngagementRecordService,
    EngagementTaskDistributionWorker,
    EngagementReplyToCommentWorker,
  ],
  exports: [
    FacebookEngagementProvider,
    InstagramEngagementProvider,
    ThreadsEngagementProvider,
    YoutubeEngagementProvider,
    EngagementService,
    EngagementRecordService,
    EngagementTaskDistributionWorker,
    EngagementReplyToCommentWorker,
  ],
})
export class EngagementModule {}
