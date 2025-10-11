/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 其他模块
 */
import { Global, Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Feedback, FeedbackSchema } from 'src/db/schema/feedback.schema';
import { QaService } from './qa.service';
import { QaRecord, QaRecordSchema } from 'src/db/schema/qaRecord.schema';
import { QaController } from './qa.controller';
import { FeedbackAdminController } from './feedbackAdmin.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: QaRecord.name, schema: QaRecordSchema },
    ]),
  ],
  providers: [FeedbackService, QaService],
  controllers: [FeedbackController, QaController, FeedbackAdminController],
})
export class OtherModule {}
