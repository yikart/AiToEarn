import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { PlatBilibiliNatsApi } from './api/bilibili.natsApi'
import { EngagementNatsApi } from './api/engagement/engagement.api'
import { InteractNatsApi } from './api/interact/interact.natsApi'
import { InteractionRecordNatsApi } from './api/interact/interactionRecord.natsApi'
import { ReplyCommentRecordNatsApi } from './api/interact/replyCommentRecord.natsApi'
import { PlatKwaiNatsApi } from './api/kwai.natsApi'
import { PlatMetaNatsApi } from './api/meta.natsApi'
import { PlatPinterestNatsApi } from './api/pinterest.natsApi'
import { PlatPublishNatsApi } from './api/publish.natsApi'
import { PublishTaskNatsApi } from './api/publishTask.natsApi'
import { ChannelSkKeyNatsApi } from './api/skKeyNatsApi.natsApi'
import { PlatTiktokNatsApi } from './api/tiktok.natsApi'
import { PlatTwitterNatsApi } from './api/twitter.natsApi'
import { PlatWxGzhNatsApi } from './api/wxGzh.natsApi'
import { PlatYoutubeNatsApi } from './api/youtube.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    EngagementNatsApi,
    InteractNatsApi,
    InteractionRecordNatsApi,
    ReplyCommentRecordNatsApi,
    PlatBilibiliNatsApi,
    PlatKwaiNatsApi,
    PlatMetaNatsApi,
    PlatPinterestNatsApi,
    PlatPublishNatsApi,
    PublishTaskNatsApi,
    ChannelSkKeyNatsApi,
    PlatTiktokNatsApi,
    PlatTwitterNatsApi,
    PlatWxGzhNatsApi,
    PlatYoutubeNatsApi,
  ],
  exports: [
    EngagementNatsApi,
    InteractNatsApi,
    InteractionRecordNatsApi,
    ReplyCommentRecordNatsApi,
    PlatBilibiliNatsApi,
    PlatKwaiNatsApi,
    PlatMetaNatsApi,
    PlatPinterestNatsApi,
    PlatPublishNatsApi,
    PublishTaskNatsApi,
    ChannelSkKeyNatsApi,
    PlatTiktokNatsApi,
    PlatTwitterNatsApi,
    PlatWxGzhNatsApi,
    PlatYoutubeNatsApi,
  ],
})
export class ChannelApiModule { }
