import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { TransportsService } from '../transports.service'
import { User } from './comment'

@Injectable()
export class UserNatsApi extends TransportsService {
  /**
   * 获取用户信息
   */
  async getInfo(userId: string) {
    const res = await this.aitoearnServerRequest<User>(
      'post',
      NatsApi.user.user.getUserInfoById,
      { id: userId },
    )

    return res
  }
}
