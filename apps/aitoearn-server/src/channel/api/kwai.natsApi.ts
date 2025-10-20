import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { Account } from '@yikart/mongodb'
import { config } from '../../config'

@Injectable()
export class PlatKwaiNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  // 获取页面的认证URL
  async getAuth(data: { type: 'h5' | 'pc', userId: string, spaceId: string }) {
    const res = await this.httpService.axiosRef.post<{
      url: string
      taskId: string
    }>(
      `${config.channel.baseUrl}/plat/kwai/auth`,
      data,
    )
    return res.data
  }

  async getAuthInfo(taskId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/kwai/getAuthInfo`,
      {
        taskId,
      },
    )
    return res.data
  }

  async createAccountAndSetAccessToken(data: {
    taskId: string
    code: string
    state: string
  }) {
    const res = await this.httpService.axiosRef.post<Account>(
      `${config.channel.baseUrl}/plat/kwai/createAccountAndSetAccessToken`,
      data,
    )
    return res.data
  }
}
