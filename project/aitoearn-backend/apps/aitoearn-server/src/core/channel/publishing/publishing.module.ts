import { Module } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { ShortLinkModule } from '../../short-link/short-link.module'
import { BilibiliModule } from '../platforms/bilibili/bilibili.module'
import { ChannelSharedModule } from '../platforms/channel-shared.module'
import { DouyinModule } from '../platforms/douyin/douyin.module'
import { GoogleBusinessModule } from '../platforms/google-business/google-business.module'
import { KwaiModule } from '../platforms/kwai/kwai.module'
import { MetaModule } from '../platforms/meta/meta.module'
import { PinterestModule } from '../platforms/pinterest/pinterest.module'
import { TiktokModule } from '../platforms/tiktok/tiktok.module'
import { TwitterModule } from '../platforms/twitter/twitter.module'
import { WxPlatModule } from '../platforms/wx-plat/wx-plat.module'
import { YoutubeModule } from '../platforms/youtube/youtube.module'
import { FinalizePublishPostConsumer } from './consumers/finalize-publish.consumer'
import { ImmediatePublishPostConsumer } from './consumers/immediate-publish.consumer'
import { UpdatePublishedPostConsumer } from './consumers/update-published-post.consumer'
import { CredentialInvalidationService } from './credential-invalidation.service'
import { PublishingErrorHandler } from './error-handler.service'
import { MediaStagingService } from './media-staging.service'
import { BilibiliPubService } from './providers/bilibili.service'
import { DouyinPubService } from './providers/douyin.service'
import { FacebookPublishService } from './providers/facebook.service'
import { GoogleBusinessPubService } from './providers/google-business.service'
import { InstagramPublishService } from './providers/instgram.service'
import { kwaiPubService } from './providers/kwai.service'
import { LinkedinPublishService } from './providers/linkedin.service'
import { PinterestPubService } from './providers/pinterest.service'
import { ThreadsPublishService } from './providers/threads.service'
import { TiktokPubService } from './providers/tiktok.service'
import { TwitterPubService } from './providers/twitter.service'
import { WxGzhPubService } from './providers/wx-gzh.service'
import { YoutubePubService } from './providers/youtube.service'
import { PublishingService } from './publishing.service'
import { EnqueuePublishingTaskScheduler } from './scheduler/enqueue-publishing-task.scheduler'

@Module({
  imports: [
    ChannelSharedModule,
    ShortLinkModule,
    BilibiliModule,
    PinterestModule,
    KwaiModule,
    YoutubeModule,
    WxPlatModule,
    MetaModule,
    TiktokModule,
    TwitterModule,
    PinterestModule,
    DouyinModule,
    GoogleBusinessModule,
  ],
  providers: [
    CredentialInvalidationService,
    PublishingErrorHandler,
    MediaStagingService,
    PublishingService,
    ImmediatePublishPostConsumer,
    FinalizePublishPostConsumer,
    UpdatePublishedPostConsumer,
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
    DouyinPubService,
    GoogleBusinessPubService,
    EnqueuePublishingTaskScheduler,
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
        douyin: DouyinPubService,
        googleBusiness: GoogleBusinessPubService,
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
        [AccountType.Douyin]: douyin,
        [AccountType.GOOGLE_BUSINESS]: googleBusiness,
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
        DouyinPubService,
        GoogleBusinessPubService,
      ],
    },
  ],
  controllers: [],
  exports: [PublishingService, DouyinPubService],
})
export class PublishModule {}
