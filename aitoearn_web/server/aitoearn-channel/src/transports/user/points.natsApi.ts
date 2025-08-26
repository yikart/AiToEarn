import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { NatsService } from '../nats.service'
import { AddPoints } from './common'

@Injectable()
export class PointsNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 添加积分
   * @param data
   * @returns
   */
  async addPoints(data: AddPoints) {
    return await this.natsService.sendMessage<void>(
      NatsApi.user.points.add,
      data,
    )
  }
}
