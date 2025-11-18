import { Module } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { BilibiliModule } from './bilibili/bilibili.module'
import { BilibiliService } from './bilibili/bilibili.service'
import { DumpAvatarConsumer } from './dump-avatar.consumer'
import { KwaiModule } from './kwai/kwai.module'
import { KwaiService } from './kwai/kwai.service'
import { FacebookService } from './meta/facebook.service'
import { InstagramService } from './meta/instagram.service'
import { LinkedinService } from './meta/linkedin.service'
import { MetaModule } from './meta/meta.module'
import { MetaService } from './meta/meta.service'
import { ThreadsService } from './meta/threads.service'
import { PinterestModule } from './pinterest/pinterest.module'
import { PinterestService } from './pinterest/pinterest.service'
import { PlatformController } from './platforms.controller'
import { PlatformService } from './platforms.service'
import { TiktokModule } from './tiktok/tiktok.module'
import { TiktokService } from './tiktok/tiktok.service'
import { TwitterModule } from './twitter/twitter.module'
import { TwitterService } from './twitter/twitter.service'
import { WxPlatModule } from './wx-plat/wx-plat.module'
import { YoutubeModule } from './youtube/youtube.module'
import { YoutubeService } from './youtube/youtube.service'

@Module({
  imports: [
    BilibiliModule,
    KwaiModule,
    MetaModule,
    PinterestModule,
    TiktokModule,
    TwitterModule,
    WxPlatModule,
    YoutubeModule,
  ],
  controllers: [PlatformController],
  providers: [
    PlatformService,
    DumpAvatarConsumer,
    {
      provide: 'CHANNEL_PROVIDERS',
      useFactory: (
        bilibili: BilibiliService,
        kwai: KwaiService,
        youtube: YoutubeService,
        facebook: FacebookService,
        instagram: InstagramService,
        threads: ThreadsService,
        tiktok: TiktokService,
        twitter: TwitterService,
        pinterest: PinterestService,
        linkedin: LinkedinService,
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
        BilibiliService,
        KwaiService,
        YoutubeService,
        MetaService,
        InstagramService,
        MetaService,
        TiktokService,
        TwitterService,
        PinterestService,
        MetaService,
      ],
    },
  ],
  exports: [],
})
export class PlatModule {}
