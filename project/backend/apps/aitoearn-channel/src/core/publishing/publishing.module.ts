import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Account, AccountSchema } from '../../libs/database/schema/account.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from '../../libs/database/schema/oauth2Credential.schema'
import {
  PostMediaContainer,
  PostMediaContainerSchema,
} from '../../libs/database/schema/postMediaContainer.schema'
import {
  PublishTask,
  PublishTaskSchema,
} from '../../libs/database/schema/publishTask.schema'
import { BilibiliModule } from '../platforms/bilibili/bilibili.module'
import { KwaiModule } from '../platforms/kwai/kwai.module'
import { MetaModule } from '../platforms/meta/meta.module'
import { PinterestModule } from '../platforms/pinterest/pinterest.module'
import { TiktokModule } from '../platforms/tiktok/tiktok.module'
import { TwitterModule } from '../platforms/twitter/twitter.module'
import { WxPlatModule } from '../platforms/wx-plat/wx-plat.module'
import { YoutubeModule } from '../platforms/youtube/youtube.module'
import { FinalizePublishPostConsumer } from './consumers/finalize-publish.consumer'
import { ImmediatePublishPostConsumer } from './consumers/immediate-publish.consumer'
import { CredentialInvalidationService } from './credential-invalidation.service'
import { PublishingErrorHandler } from './error-handler.service'
import { MediaStagingService } from './media-staging.service'
import { BilibiliPubService } from './providers/bilibili.service'
import { FacebookPublishService } from './providers/facebook.service'
import { InstagramPublishService } from './providers/instgram.service'
import { kwaiPubService } from './providers/kwai.service'
import { LinkedinPublishService } from './providers/linkedin.service'
import { PinterestPubService } from './providers/pinterest.service'
import { ThreadsPublishService } from './providers/threads.service'
import { TiktokPubService } from './providers/tiktok.service'
import { TwitterPubService } from './providers/twitter.service'
import { WxGzhPubService } from './providers/wx-gzh.service'
import { YoutubePubService } from './providers/youtube.service'
import { PublishingController } from './publishing.controller'
import { PublishingService } from './publishing.service'
import { EnqueuePublishingTaskScheduler } from './scheduler/enqueue-publishing-task.scheduler'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: PublishTask.name, schema: PublishTaskSchema },
      { name: PostMediaContainer.name, schema: PostMediaContainerSchema },
      { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
    ]),
    BilibiliModule,
    PinterestModule,
    KwaiModule,
    YoutubeModule,
    forwardRef(() => WxPlatModule),
    MetaModule,
    TiktokModule,
    TwitterModule,
    PinterestModule,
  ],
  providers: [
    CredentialInvalidationService,
    PublishingErrorHandler,
    MediaStagingService,
    PublishingService,
    ImmediatePublishPostConsumer,
    FinalizePublishPostConsumer,
    BilibiliPubService,
    kwaiPubService,
    PinterestPubService,
    YoutubePubService,
    WxGzhPubService,
    FacebookPublishService,
    InstagramPublishService,
    ThreadsPublishService,
    TiktokPubService,
    LinkedinPublishService,
    TwitterPubService,
    EnqueuePublishingTaskScheduler,
    CredentialInvalidationService,
    PublishingErrorHandler,
    {
      provide: 'PUBLISHING_PROVIDERS',
      useFactory: (
        bilibili: BilibiliPubService,
        kwai: kwaiPubService,
        youtube: YoutubePubService,
        facebook: FacebookPublishService,
        instagram: InstagramPublishService,
        threads: ThreadsPublishService,
        tiktok: TiktokPubService,
        twitter: TwitterPubService,
        pinterest: PinterestPubService,
        linkedin: LinkedinPublishService,
      ) => ({
        [AccountType.BILIBILI]: bilibili,
        [AccountType.KWAI]: kwai,
        [AccountType.YOUTUBE]: youtube,
        [AccountType.FACEBOOK]: facebook,
        [AccountType.INSTAGRAM]: instagram,
        [AccountType.THREADS]: threads,
        [AccountType.TIKTOK]: tiktok,
        [AccountType.TWITTER]: twitter,
        [AccountType.PINTEREST]: pinterest,
        [AccountType.LINKEDIN]: linkedin,
      }),
      inject: [
        BilibiliPubService,
        kwaiPubService,
        YoutubePubService,
        FacebookPublishService,
        InstagramPublishService,
        ThreadsPublishService,
        TiktokPubService,
        TwitterPubService,
        PinterestPubService,
        LinkedinPublishService,
      ],
    },
  ],
  controllers: [PublishingController],
  exports: [PublishingService],
})
export class PublishModule {}
