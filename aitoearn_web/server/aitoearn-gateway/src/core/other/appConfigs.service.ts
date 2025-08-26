import { Injectable } from '@nestjs/common'
import { AppConfigsNatsApi } from '@/transports/other/appConfigs.natsApi'

@Injectable()
export class AppConfigsService {
  constructor(private readonly appConfigsNatsApi: AppConfigsNatsApi) {}

  async getAppConfigList(newData: { appId: string }) {
    const res = await this.appConfigsNatsApi.getAppConfigList(newData)
    return res
  }
}
