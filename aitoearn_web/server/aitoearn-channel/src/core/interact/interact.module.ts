import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionRecord, InteractionRecordSchema } from '@/libs/database/schema/interactionRecord.schema';
import { ReplyCommentRecord, ReplyCommentRecordSchema } from '@/libs/database/schema/replyCommentRecord.schema';
import { WxPlatModule } from '../plat/wxPlat/wxPlat.module';
import { PublishModule } from '../publish/publish.module';
import { InteracteController } from './interact.controller';
import { InteractionRecordController } from './interactionRecord.controller';
import { InteractionRecordService } from './interactionRecord.service';
import { ReplyCommentRecordController } from './replyCommentRecord.controller';
import { ReplyCommentRecordService } from './replyCommentRecord.service';
import { WxGzhInteractService } from './wxGzhInteract.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InteractionRecord.name, schema: InteractionRecordSchema },
      { name: ReplyCommentRecord.name, schema: ReplyCommentRecordSchema },
    ]),
    WxPlatModule,
    PublishModule,
  ],
  controllers: [InteracteController, InteractionRecordController, ReplyCommentRecordController],
  providers: [WxGzhInteractService, InteractionRecordService, ReplyCommentRecordService],
  exports: [WxGzhInteractService],
})
export class InteracteModule {}
