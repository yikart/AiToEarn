import { Injectable } from '@nestjs/common'
import { PlatBilibiliNatsApi } from '../../transports/channel/api/bilibili.natsApi'

@Injectable()
export class BilibiliService {
  constructor(private readonly platBilibiliNatsApi: PlatBilibiliNatsApi) {}

  /**
   * 检查登陆状态是否过期
   * @param accountId
   * @param file File
   * @returns
   */
  async checkAccountAuthStatus(accountId: string) {
    const res = await this.platBilibiliNatsApi.getAccountAuthInfo(accountId)
    return res
  }
}
