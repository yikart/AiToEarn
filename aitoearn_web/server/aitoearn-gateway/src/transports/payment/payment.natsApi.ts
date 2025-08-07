import { Injectable } from '@nestjs/common'
import * as _ from 'lodash'
import { NatsService } from 'src/transports/nats.service'
import {
  CheckoutBodyDto,
  CheckoutListBody,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
  WebhookDto,
} from '../../core/payment/dto/payment.dto'
import { NatsApi } from '../api'

@Injectable()
export class PaymentNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取订单列表
   * @returns
   * @param body
   */
  async list(body: CheckoutListBody) {
    const result = await this.natsService.sendMessage<string>(
      NatsApi.payment.list,
      body,
    )
    return _.get(result, 'data')
  }

  /**
   * 查询订单
   * @returns
   * @param id
   * @param userId
   */
  async getById(id: string, userId: string) {
    const result = await this.natsService.sendMessage<string>(
      NatsApi.payment.getById,
      { id, userId },
    )
    return _.get(result, 'data')
  }

  /**
   * 创建订单
   * @returns
   * @param body
   */
  async create(body: CheckoutBodyDto) {
    const result = await this.natsService.sendMessage(
      NatsApi.payment.create,
      body,
    )
    return _.get(result, 'data')
  }

  /**
   * 退款
   * @returns
   * @param body
   */
  async refund(body: RefundBodyDto) {
    const result = await this.natsService.sendMessage(
      NatsApi.payment.refund,
      body,
    )
    return _.get(result, 'data')
  }

  /**
   * 订阅列表
   * @returns
   * @param body
   */
  async subscription(body: SubscriptionBodyDto) {
    const result = await this.natsService.sendMessage(
      NatsApi.payment.subscription,
      body,
    )
    return _.get(result, 'data')
  }

  /**
   * 退订
   * @returns
   * @param body
   */
  async unsubscribe(body: UnSubscriptionBodyDto) {
    const result = await this.natsService.sendMessage(
      NatsApi.payment.unsubscribe,
      body,
    )
    return _.get(result, 'data')
  }

  /**
   * stripe回调
   * @returns
   * @param body
   */
  async webhook(body: WebhookDto, prefix?: string) {
    const result = await this.natsService.sendMessage(
      NatsApi.payment.webhook,
      body,
      prefix,
    )
    return _.get(result, 'data')
  }
}
