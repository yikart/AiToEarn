import { Module } from '@nestjs/common'
import { InteractController } from '../channel/interact/interact.controller'
import { BilibiliModule } from './bilibili/bilibili.module'
import { DataCubeModule } from './dataCube/dataCube.module'
import { EngagementController } from './engagement/engagement.controller'
import { EngagementModule } from './engagement/engagement.module'
import { KwaiModule } from './kwai/kwai.module'
import { MetaModule } from './meta/meta.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'
import { SkKeyModule } from './skKey/skKey.module'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WxGzhModule } from './wxGzh/wxGzh.module'
import { YoutubeModule } from './youtube/youtube.module'

@Module({
  imports: [
    DataCubeModule,
    SkKeyModule,
    BilibiliModule,
    WxGzhModule,
    YoutubeModule,
    KwaiModule,
    TiktokModule,
    PinterestModule,
    TwitterModule,
    MetaModule,
    EngagementModule,
  ],
  controllers: [PublishController, InteractController, EngagementController],
  providers: [PublishService],
})
export class PlatModule {}
