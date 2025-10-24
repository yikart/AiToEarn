import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import { User } from './comment'

@Injectable()
export class UserNatsApi extends ServerBaseApi {
  /**
   * 获取用户信息
   */
  async getInfo(userId: string) {
    const res = await this.sendMessage<User>(
      'userInternal/user/info',
      { id: userId },
    )

    return res
  }
}
