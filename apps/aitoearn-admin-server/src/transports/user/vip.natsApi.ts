import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import { VipStatus } from './common'

@Injectable()
export class VipApi extends ServerBaseApi {
  async setVipInfo(data: {
    userId: string
    status: VipStatus
  }) {
    const res = await this.sendMessage<boolean>(
      'vipInternal/set',
      {
        userId: data.userId,
        status: data.status,
      },
    )

    return res
  }
}
