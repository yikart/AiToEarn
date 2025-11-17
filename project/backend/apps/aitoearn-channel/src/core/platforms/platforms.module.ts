import { Module } from '@nestjs/common'
import { BilibiliModule } from './bilibili/bilibili.module'
import { DumpAvatarConsumer } from './dump-avatar.consumer'
import { KwaiModule } from './kwai/kwai.module'
import { MetaModule } from './meta/meta.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PlatformController } from './platforms.controller'
import { PlatformService } from './platforms.service'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WxPlatModule } from './wx-plat/wx-plat.module'
import { YoutubeModule } from './youtube/youtube.module'

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
  providers: [PlatformService, DumpAvatarConsumer],
  exports: [],
})
export class PlatModule {}
