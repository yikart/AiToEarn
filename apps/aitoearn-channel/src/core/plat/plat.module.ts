import { Module } from '@nestjs/common'
import { BilibiliModule } from './bilibili/bilibili.module'
import { KwaiModule } from './kwai/kwai.module'
import { MetaModule } from './meta/meta.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PlatformController } from './plat.controller'
import { PlatformService } from './plat.service'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WxPlatModule } from './wxPlat/wxPlat.module'
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
  providers: [PlatformService],
  exports: [],
})
export class PlatModule {}
