import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { CreateFeedback, Feedback } from './comment'

@Injectable()
export class FeedbackNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取鉴权头
   * @returns
   */
  async create(data: CreateFeedback) {
    const res = await this.natsService.sendMessage<Feedback>(
      NatsApi.other.feedback.create,
      data,
    )

    return res
  }
}
