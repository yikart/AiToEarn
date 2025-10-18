import { Module } from '@nestjs/common'
import { InteractController } from './interact.controller'
import { InteractService } from './interact.service'
import { InteractionRecordController } from './interactionRecord.controller'
import { InteractionRecordService } from './interactionRecord.service'
import { ReplyCommentRecordController } from './replyCommentRecord.controller'
import { ReplyCommentRecordService } from './replyCommentRecord.service'

@Module({
  imports: [],
  controllers: [InteractController, InteractionRecordController, ReplyCommentRecordController],
  providers: [InteractService, InteractionRecordService, ReplyCommentRecordService],
})
export class InteractModule {}
