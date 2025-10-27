import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import axios from 'axios'
import { config } from '../config'

@Injectable()
export class PaymentBaseApi {
  private readonly logger = new Logger(PaymentBaseApi.name)
  constructor(private readonly httpService: HttpService) { }
  async sendMessage<T>(path: string, body: any): Promise<T> {
    const res = await axios.post<{
      code: number
      message: string
      data: T
      timestamp: number
    }>(`${config.channelApi.baseUrl}/${path}`, body)
    if (res.data.code !== 0) {
      this.logger.error({ path, ...res })
      throw new AppException(res.data.code, res.data.message)
    }
    return res.data.data
  }
}
