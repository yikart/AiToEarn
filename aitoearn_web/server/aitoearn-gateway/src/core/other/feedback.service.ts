/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common'
import { CreateFeedback } from 'src/transports/other/comment'
import { FeedbackNatsApi } from 'src/transports/other/feedback.natsApi'

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackNatsApi: FeedbackNatsApi) {}

  async createFeedback(newData: CreateFeedback) {
    const res = await this.feedbackNatsApi.create(newData)
    return res
  }
}
