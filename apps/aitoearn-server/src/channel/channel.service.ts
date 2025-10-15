import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { AccountStatus } from '@yikart/mongodb'

@Injectable()
export class ChannelService {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * TODO: 获取用户账号列表
   * @param data
   */
  async getUserAccounts(
    userId: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/account/portrait/report',
      { userId },
    )
    return res.data
  }

  async updateChannelAccountStatus(userId: string, status: AccountStatus) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/account/portrait/report',
      { userId, status },
    )
    return res.data
  }
}
