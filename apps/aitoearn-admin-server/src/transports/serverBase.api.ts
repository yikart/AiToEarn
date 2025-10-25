import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import axios from 'axios'
import { ExceptionCode } from '../common'
import { config } from '../config'

@Injectable()
export class ServerBaseApi {
  private readonly logger = new Logger(ServerBaseApi.name)
  constructor() { }
  async sendMessage<T>(path: string, body: any): Promise<T> {
    const res = await axios.post<{
      code: number
      message: string
      data: T
      timestamp: number
    }>(`${config.serverApi.baseUrl}/${path}`, body, {
      headers: {
        Authorization: `Bearer ${config.serverApi.internalToken}`,
      },
    })
    if (res.data.code !== ExceptionCode.Success) {
      this.logger.error({ path, ...res })
      throw new AppException(res.data.code, res.data.message)
    }
    return res.data.data
  }
}
