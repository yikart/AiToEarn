import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { PublishModule } from '../publishRecord/publishRecord.module'
import { ChannelApiModule } from '../transports/channel/channelApi.module'
import { BilibiliModule } from './bilibili/bilibili.module'
import { ChannelController } from './channel.controller'
import { ChannelService } from './channel.service'
import { DataCubeModule } from './dataCube/dataCube.module'
import { EngagementController } from './engagement/engagement.controller'
import { EngagementModule } from './engagement/engagement.module'
import { InteractController } from './interact/interact.controller'
import { InteractModule } from './interact/interact.module'
import { KwaiModule } from './kwai/kwai.module'
import { MetaModule } from './meta/meta.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PostModule } from './post/post.module'
import { PostService } from './post/post.service'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'
import { SkKeyModule } from './skKey/skKey.module'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WxGzhModule } from './wxGzh/wxGzh.module'
import { YoutubeModule } from './youtube/youtube.module'

@Global()
@Module({
  imports: [
    HttpModule,
    ChannelApiModule,
    InteractModule,
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
    PostModule,
    PublishModule,
    PostModule,
  ],
  providers: [ChannelService, PublishService, PostService],
  controllers: [
    PublishController,
    InteractController,
    EngagementController,
    ChannelController,
  ],
  exports: [ChannelService],
})
export class ChannelModule { }
