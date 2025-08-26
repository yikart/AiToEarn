import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { NatsService } from '../nats.service'

@Injectable()
export class UserPointsNatsApi {
  constructor(
    private readonly natsService: NatsService,
  ) {}

  /** 获取积分记录列表 */
  async getRecords(userId: string, page = 1, pageSize = 10): Promise<{ list: any[], total: number }> {
    return this.natsService.sendMessage<{ list: any[], total: number }>(
      NatsApi.user.points.getRecords,
      { userId, page, pageSize },
    )
  }
}
