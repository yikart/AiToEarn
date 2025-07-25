/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 其他模块
 */
import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

@Module({
  imports: [UserModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class OtherModule {}
