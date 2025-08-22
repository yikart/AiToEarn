import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { AppConfigs } from './comment'

@Injectable()
export class AppConfigsNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取配置列表
   * @returns
   */
  async getAppConfigList(data: {
    appId: string
  }) {
    const res = await this.natsService.sendMessage<AppConfigs[]>(
      NatsApi.other.appConfigs.list,
      data,
    )

    return res
  }
}
