import { Injectable } from '@nestjs/common'
/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */
import { Feedback, FeedbackRepository } from '@yikart/mongodb'

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository,
  ) { }

  async createFeedback(newData: Partial<Feedback>) {
    const res = await this.feedbackRepository.create(newData)
    return res
  }
}
