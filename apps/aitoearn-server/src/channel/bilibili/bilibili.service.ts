import { Injectable } from '@nestjs/common'
import { PlatBilibiliApi } from './bilibili.api'

@Injectable()
export class BilibiliService {
  constructor(private readonly platBilibiliApi: PlatBilibiliApi) {}

  /**
   * 检查登陆状态是否过期
   * @param accountId
   * @param file File
   * @returns
   */
  async checkAccountAuthStatus(accountId: string) {
    const res = await this.platBilibiliApi.getAccountAuthInfo(accountId)
    return res
  }
}
