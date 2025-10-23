import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { AccountStatus } from '@yikart/mongodb'
import { config } from '../config'

@Injectable()
export class ChannelService {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * TODO: 获取用户账号列表
   * @param userId
   */
  async getUserAccounts(
    userId: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/account/portrait/report`,
      { userId },
    )
    return res.data
  }

  async updateChannelAccountStatus(userId: string, status: AccountStatus) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/account/portrait/report`,
      { userId, status },
    )
    return res.data
  }
}
