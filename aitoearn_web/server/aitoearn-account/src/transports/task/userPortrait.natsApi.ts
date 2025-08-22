import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { NatsService } from '../nats.service'

@Injectable()
export class UserPortraitNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * TODO://上报用户账号数据
   * @param data
   * @returns
   */
  async upUserData(
    data: any,
  ) {
    return await this.natsService.sendMessage<boolean>(
      NatsApi.task.userPortrait.upAccountData,
      data,
    )
  }
}
