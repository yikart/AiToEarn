import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { AppException } from '@yikart/common'
import { lastValueFrom } from 'rxjs'
import { NatsConfig } from './nats.config'

interface CommonResponse<T> {
  data: T
  code: number
  message: string
}

@Injectable()
export class NatsClient {
  constructor(
    @Inject('NATS_CLIENT') private readonly client: ClientProxy,
    private readonly config: NatsConfig,
  ) {}

  async send<TResult = unknown>(pattern: string, data?: unknown): Promise<TResult> {
    pattern = this.config.prefix ? `${this.config.prefix}.${pattern}` : pattern
    const response = await lastValueFrom(
      this.client.send<CommonResponse<TResult>>(pattern, data),
    )

    if (response.code !== 0) {
      throw new AppException(response.code, response.message)
    }

    return response.data
  }

  async emit<TResult = unknown>(pattern: string, data?: unknown): Promise<TResult> {
    pattern = this.config.prefix ? `${this.config.prefix}.${pattern}` : pattern
    const response = await lastValueFrom(
      this.client.emit<CommonResponse<TResult>>(pattern, data),
    )

    if (response.code !== 0) {
      throw new AppException(response.code, response.message)
    }

    return response.data
  }
}
