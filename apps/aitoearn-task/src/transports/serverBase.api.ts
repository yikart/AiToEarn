import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import axios from 'axios'
import { config } from '../config'

@Injectable()
export class ServerBaseApi {
  readonly logger = new Logger(ServerBaseApi.name)
  constructor() { }
  async sendMessage<T>(path: string, body: any): Promise<T> {
    const res = await axios.post<{
      code: number
      message: string
      data: T
      timestamp: number
    }>(`${config.serverApi.baseUrl}/${path}`, body, {
      headers: {
        Authorization: `Barer ${config.serverApi.internalToken}`,
      },
    })
    if (res.data.code !== 0) {
      this.logger.error({ path, ...res })
      throw new AppException(res.data.code, res.data.message)
    }
    return res.data.data
  }
}
