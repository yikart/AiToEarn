import { Injectable, Logger } from '@nestjs/common'
import { ExceptionCode } from '@/common/enums'
import { AppException } from '@/common/exceptions'
import { NatsService } from './nats.service'

@Injectable()
export class BaseNatsApi {
  private readonly logger = new Logger(BaseNatsApi.name)
  constructor(private readonly natsService: NatsService) {}

  async sendMessage<T>(pattern: string, request: any): Promise<T> {
    try {
      const res = await this.natsService.sendMessage<{
        code: number
        message: string
        data: T
        timestamp: number
      }>(pattern, request)
      if (res.code !== ExceptionCode.Success) {
        throw new AppException(res.code, res.message)
      }
      return res.data
    }
    catch (error) {
      this.logger.error(`-------- nats 【${pattern}】 message error ------`, error)
      this.logger.debug(error, `-------- nats 【${pattern}】 message error ------`)

      throw new AppException(ExceptionCode.ExternalServiceError)
    }
  }
}
