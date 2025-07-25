import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { User, UserVipCycleType } from './comment'

@Injectable()
export class UserVipNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 设置用户vip信息
   * @param userId
   * @param cycleType
   * @returns
   */
  async setUserVipInfo(userId: string, cycleType: UserVipCycleType) {
    const res = await this.natsService.sendMessage<User>(NatsApi.user.vip.set, {
      id: userId,
      cycleType,
    })

    return res
  }
}
