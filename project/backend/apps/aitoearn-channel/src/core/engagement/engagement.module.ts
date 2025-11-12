import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EngagementSubTask, EngagementSubTaskSchema, EngagementTask, EngagementTaskSchema } from '../../libs/database/schema/engagement.task.schema'
import { MetaModule } from '../plat/meta/meta.module'
import { YoutubeModule } from '../plat/youtube/youtube.module'
import { EngagementController } from './engagement.controller'
import { EngagementRecordService } from './engagement.record.service'
import { EngagementService } from './engagement.service'
import { FacebookEngagementProvider } from './providers/facebook.provider'
import { InstagramEngagementProvider } from './providers/instagram.provider'
import { ThreadsEngagementProvider } from './providers/threads.provider'
import { YoutubeEngagementProvider } from './providers/youtube.provider'
import { EngagementTaskDistributionConsumer } from './workers/distribute-engagement-task.consumer'
import { EngagementReplyToCommentConsumer } from './workers/reply-to-comment.consumer'

@Module({
  imports: [
    MetaModule,
    YoutubeModule,
    MongooseModule.forFeature([
      { name: EngagementTask.name, schema: EngagementTaskSchema },
      { name: EngagementSubTask.name, schema: EngagementSubTaskSchema },
    ]),

  ],
  controllers: [EngagementController],
  providers: [
    FacebookEngagementProvider,
    InstagramEngagementProvider,
    ThreadsEngagementProvider,
    YoutubeEngagementProvider,
    EngagementService,
    EngagementRecordService,
    EngagementTaskDistributionConsumer,
    EngagementReplyToCommentConsumer,
  ],
  exports: [
    FacebookEngagementProvider,
    InstagramEngagementProvider,
    ThreadsEngagementProvider,
    YoutubeEngagementProvider,
    EngagementService,
    EngagementRecordService,
    EngagementTaskDistributionConsumer,
    EngagementReplyToCommentConsumer,
  ],
})
export class EngagementModule {}
