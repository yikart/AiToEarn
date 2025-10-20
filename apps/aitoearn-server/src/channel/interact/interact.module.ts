import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { InteractController } from './interact.controller'
import { InteractionRecordController } from './interactionRecord.controller'
import { InteractionRecordService } from './interactionRecord.service'
import { ReplyCommentRecordController } from './replyCommentRecord.controller'

@Module({
  imports: [HttpModule],
  controllers: [InteractController, InteractionRecordController, ReplyCommentRecordController],
  providers: [InteractionRecordService],
  exports: [InteractionRecordService],
})
export class InteractModule { }
