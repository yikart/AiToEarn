import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { ErrHttpBack } from 'src/common/filters/httpException.code'
import { AppHttpException } from 'src/common/filters/httpException.filter'
import { config } from '@/config'

@Injectable()
export class NatsService {
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
  async sendMessage<T>(pattern: string, data: unknown, prefix?: string) {
    const path = `${prefix || this.prefix}.${pattern}`
    const ret = this.client.send<T>(path, data)

    try {
      const res = await lastValueFrom(ret)
      return res
    }
    catch (error) {
      Logger.error(`-------- nats 【${path}】 message error ------`, error)
      Logger.debug(error, `-------- nats 【${path}】 message error ------`)

      throw new AppHttpException(ErrHttpBack.fail)
    }
  }
}
