import { Module } from '@nestjs/common'
import { BilibiliModule } from './bilibili/bilibili.module'
import { DataCubeController } from './dataCube.controller'
import { InteractController } from './interact.controller'
import { KwaiModule } from './kwai/kwai.module'
import { MetaModule } from './meta/meta.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PlatTestController } from './platTest.controller'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'
import { SkKeyModule } from './skKey/skKey.module'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WxGzhModule } from './wxGzh/wxGzh.module'
import { YoutubeModule } from './youtube/youtube.module'

@Module({
  imports: [
    SkKeyModule,
    BilibiliModule,
    WxGzhModule,
    YoutubeModule,
    KwaiModule,
    TiktokModule,
    PinterestModule,
    TwitterModule,
    MetaModule,
  ],
  controllers: [PublishController, PlatTestController, DataCubeController, InteractController],
  providers: [PublishService],
})
export class PlatModule {}
