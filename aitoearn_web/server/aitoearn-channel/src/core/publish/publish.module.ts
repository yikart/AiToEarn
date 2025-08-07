import { BullModule } from '@nestjs/bullmq'
import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
  MetaContainer,
  MetaContainerSchema,
} from '@/libs/database/schema/metaContainer.schema'
import {
  PublishRecord,
  PublishRecordSchema,
} from '@/libs/database/schema/publishRecord.schema'
import {
  PublishTask,
  PublishTaskSchema,
} from '@/libs/database/schema/publishTask.schema'
import { BilibiliModule } from '../plat/bilibili/bilibili.module'
import { KwaiModule } from '../plat/kwai/kwai.module'
import { MetaModule } from '../plat/meta/meta.module'
import { TiktokModule } from '../plat/tiktok/tiktok.module'
import { TwitterModule } from '../plat/twitter/twitter.module'
import { WxPlatModule } from '../plat/wxPlat/wxPlat.module'
import { YoutubeModule } from '../plat/youtube/youtube.module'
import { BilibiliPubService } from './plat/bilibiliPub.service'
import { kwaiPubService } from './plat/kwaiPub.service'
import { FacebookPublishService } from './plat/meta/facebook.service'
import { InstagramPublishService } from './plat/meta/instgram.service'
import { MetaPublishModule } from './plat/meta/meta.module'
import { MetaPublishWorker } from './plat/meta/publish.woker'
import { ThreadsPublishService } from './plat/meta/threads.service'
import { TiktokPubService } from './plat/tiktokPub.service'
import { WxGzhPubService } from './plat/wxGzhPub.service'
import { YoutubePubService } from './plat/youtubePub.service'
import { BullPublish } from './publish.bull'
import { PublishRecordController } from './publishRecord.controller'
import { PublishRecordService } from './publishRecord.service'
import { PublishTaskController } from './publishTask.controller'
import { PublishTaskService } from './publishTask.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublishRecord.name, schema: PublishRecordSchema },
      { name: PublishTask.name, schema: PublishTaskSchema },
      { name: MetaContainer.name, schema: MetaContainerSchema },
    ]),
    BullModule.registerQueue({
      name: 'bull_publish',
    }),
    BullModule.registerQueue({
      name: 'meta_media_task',
      prefix: 'meta:',
      defaultJobOptions: {
        attempts: 3,
        delay: 20000, // 20 seconds
        removeOnComplete: true,
      },
    }),
    BilibiliModule,
    KwaiModule,
    YoutubeModule,
    forwardRef(() => WxPlatModule),
    MetaModule,
    TiktokModule,
    MetaPublishModule,
    TwitterModule,
  ],
  providers: [
    PublishRecordService,
    PublishTaskService,
    BullPublish,
    BilibiliPubService,
    kwaiPubService,
    YoutubePubService,
    WxGzhPubService,
    FacebookPublishService,
    InstagramPublishService,
    ThreadsPublishService,
    TiktokPubService,
    MetaPublishWorker,
    ThreadsPublishService,
  ],
  controllers: [PublishRecordController, PublishTaskController],
  exports: [PublishRecordService, PublishTaskService],
})
export class PublishModule {}
