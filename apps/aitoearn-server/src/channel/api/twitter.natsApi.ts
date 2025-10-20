import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'

@Injectable()
export class PlatTwitterNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getAuthUrl(userId: string, scopes?: string[], spaceId?: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.channel.baseUrl}/plat/twitter/authUrl`,
      {
        userId,
        scopes,
        spaceId: spaceId || '',
      },
    )
    return res.data
  }

  async getAuthInfo(taskId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/twitter/getAuthInfo`,
      {
        taskId,
      },
    )
    return res.data
  }

  async createAccountAndSetAccessToken(
    code: string,
    state: string,
  ) {
    const res = await this.httpService.axiosRef.post<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      `${config.channel.baseUrl}/plat/twitter/createAccountAndSetAccessToken`,
      {
        code,
        state,
      },
    )
    return res.data
  }
}
