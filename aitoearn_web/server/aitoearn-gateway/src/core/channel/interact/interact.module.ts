import { Module } from '@nestjs/common'
import { InteractController } from './interact.controller'
import { InteractionRecordController } from './interactionRecord.controller'
import { ReplyCommentRecordController } from './replyCommentRecord.controller'

@Module({
  imports: [],
  controllers: [InteractController, InteractionRecordController, ReplyCommentRecordController],
  providers: [],
})
export class InteractModule {}
