import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { ErrHttpBack } from 'src/common/filters/httpException.code'
import { AppException } from '@/common/exceptions'
import { config } from '@/config'
import { NatsRes } from './comment'

@Injectable()
export class NatsService {
  logger = new Logger(NatsService.name)

  private prefix = ''
  constructor(
    @Inject('AITOEARN_SERVICE') private readonly client: ClientProxy,
  ) {
    this.prefix = config.nats.prefix
  }

  /**
   * 发送事件
   * @param pattern
   * @param data
   */
  publishEvent(pattern: string, data: any) {
    this.client.emit(`${this.prefix}.${pattern}`, data)
  }

  /**
   * 发送消息
   * @param pattern
   * @param data
   * @returns
   */
  async sendMessage<T>(pattern: string, data: unknown, prefix?: string): Promise<T> {
    const path = `${prefix || this.prefix}.${pattern}`
    const ret = this.client.send<T>(path, data)

    try {
      const res = await lastValueFrom<T>(ret)
      return res
    }
    catch (error) {
      this.logger.error({
        error,
        pattern,
      })
      throw new AppException(ErrHttpBack.fail, error.message)
    }
  }
}
