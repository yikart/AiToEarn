import { Module } from '@nestjs/common'
import { ChannelSharedModule } from '../platforms/channel-shared.module'
import { WxPlatModule } from '../platforms/wx-plat/wx-plat.module'
import { PublishModule } from '../publishing/publishing.module'
import { InteracteController } from './interact.controller'
import { InteractionRecordController } from './interaction-record.controller'
import { InteractionRecordService } from './interaction-record.service'
import { ReplyCommentRecordController } from './reply-comment-record.controller'
import { ReplyCommentRecordService } from './reply-comment-record.service'
import { WxGzhInteractService } from './wx-gzh-interact.service'

@Module({
  imports: [
    ChannelSharedModule,
    WxPlatModule,
    PublishModule,
  ],
  controllers: [InteracteController, InteractionRecordController, ReplyCommentRecordController],
  providers: [WxGzhInteractService, InteractionRecordService, ReplyCommentRecordService],
  exports: [WxGzhInteractService],
})
export class InteracteModule {}
