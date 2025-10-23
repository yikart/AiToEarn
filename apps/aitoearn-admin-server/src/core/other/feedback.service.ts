import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { FeedbackRepository } from '@yikart/mongodb'
import { CreateFeedback } from '../../transports/other/comment'

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async createFeedback(newData: CreateFeedback) {
    const info = await this.feedbackRepository.create(newData)
    if (!info)
      throw new AppException(1, '创建失败')
    return info
  }
}
