import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
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
   * @param prefix
   */
  publishEvent(pattern: string, data: any, prefix?: string) {
    const path = `${prefix || this.prefix}.${pattern}`
    console.log('---------', path);
    this.client.emit(path, data)
  }

  /**
   * 发送消息
   * @param pattern
   * @param data
   * @param prefix
   * @returns
   */
  async sendMessage<T = any>(pattern: string, data: any, prefix?: string) {
    const path = `${prefix || this.prefix}.${pattern}`
    const ret = this.client.send<{
      code: number
      message: string
      data: T
      timestamp: number
    }>(path, data)

    try {
      const res = await lastValueFrom(ret)
      return res
    }
    catch (error) {
      Logger.error(`-------- nats 【${path}】 message error ------`, error)
      Logger.debug(error, `-------- nats 【${path}】 message error ------`)

      throw error
    }
  }
}
