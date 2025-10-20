import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { PlatBilibiliNatsApi } from './bilibili.natsApi'
import { EngagementNatsApi } from './engagement/engagement.natsApi'
import { InteractNatsApi } from './interact/interact.natsApi'
import { InteractionRecordNatsApi } from './interact/interactionRecord.natsApi'
import { ReplyCommentRecordNatsApi } from './interact/replyCommentRecord.natsApi'
import { PlatKwaiNatsApi } from './kwai.natsApi'
import { PlatMetaNatsApi } from './meta.natsApi'
import { PlatPinterestNatsApi } from './pinterest.natsApi'
import { PlatPublishNatsApi } from './publish.natsApi'
import { PublishTaskNatsApi } from './publishTask.natsApi'
import { ChannelSkKeyNatsApi } from './skKeyNatsApi.natsApi'
import { PlatTiktokNatsApi } from './tiktok.natsApi'
import { PlatTwitterNatsApi } from './twitter.natsApi'
import { PlatWxGzhNatsApi } from './wxGzh.natsApi'
import { PlatYoutubeNatsApi } from './youtube.natsApi'

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
