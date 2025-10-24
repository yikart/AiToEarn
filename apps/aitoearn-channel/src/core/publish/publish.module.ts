import { BullModule } from '@nestjs/bullmq'
import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PinterestModule } from '../../core/plat/pinterest/pinterest.module'
import { PinterestPubService } from '../../core/publish/plat/pinterestPub.service'
import { Account, AccountSchema } from '../../libs/database/schema/account.schema'
import {
  PostMediaContainer,
  PostMediaContainerSchema,
} from '../../libs/database/schema/postMediaContainer.schema'
import {
  PublishTask,
  PublishTaskSchema,
} from '../../libs/database/schema/publishTask.schema'
import { PublishingInternalApi } from '../../transports/publishing/publishing.api'
import { TransportModule } from '../../transports/transport.module'
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
import { LinkedinPublishService } from './plat/meta/linkedin.service'
import { MetaPublishModule } from './plat/meta/meta.module'
import { MetaPublishWorker } from './plat/meta/publish.woker'
import { ThreadsPublishService } from './plat/meta/threads.service'
import { TiktokPubService } from './plat/tiktokPub.service'
import { WxGzhPubService } from './plat/wxGzhPub.service'
import { YoutubePubService } from './plat/youtubePub.service'
import { PostPublishWorker } from './postPublish.worker'
import { PublishTaskController } from './publishTask.controller'
import { PublishTaskService } from './publishTask.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: PublishTask.name, schema: PublishTaskSchema },
      { name: PostMediaContainer.name, schema: PostMediaContainerSchema },
    ]),
    BullModule.registerQueue({
      name: 'post_publish',
    }),
    BullModule.registerQueue({
      name: 'post_media_task',
      defaultJobOptions: {
        delay: 20000, // 20 seconds
        removeOnComplete: true,
      },
    }),
    BilibiliModule,
    PinterestModule,
    KwaiModule,
    YoutubeModule,
    forwardRef(() => WxPlatModule),
    MetaModule,
    TiktokModule,
    MetaPublishModule,
    TwitterModule,
    PinterestModule,
    TransportModule,
  ],
  providers: [
    PublishTaskService,
    PostPublishWorker,
    BilibiliPubService,
    PinterestPubService,
    kwaiPubService,
    YoutubePubService,
    WxGzhPubService,
    FacebookPublishService,
    InstagramPublishService,
    ThreadsPublishService,
    TiktokPubService,
    MetaPublishWorker,
    LinkedinPublishService,
    PublishingInternalApi,
  ],
  controllers: [PublishTaskController],
  exports: [PublishTaskService],
})
export class PublishModule {}
