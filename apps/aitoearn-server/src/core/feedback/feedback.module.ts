/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 反馈模块
 */
import { Global, Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

@Global()
@Module({
  imports: [
    MongodbModule,
  ],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
