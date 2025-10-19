import { Module } from '@nestjs/common'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

@Module({
  imports: [],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
