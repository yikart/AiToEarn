import { Injectable } from '@nestjs/common'
import * as _ from 'lodash'
import {
  CheckoutBodyDto,
  CheckoutListBody,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
  WebhookDto,
} from '../../core/payment/dto/payment.dto'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class PaymentNatsApi extends BaseNatsApi {
  /**
   * 获取订单列表
   * @returns
   * @param body
   */
  async list(body: CheckoutListBody) {
    const result = await this.sendMessage<string>(
      NatsApi.payment.list,
      body,
    )
    return result
  }

  /**
   * 查询订单
   * @returns
   * @param id
   * @param userId
   */
  async getById(id: string, userId: string) {
    const result = await this.sendMessage<string>(
      NatsApi.payment.getById,
      { id, userId },
    )
    return result
  }

  /**
   * 创建订单
   * @returns
   * @param body
   */
  async create(body: CheckoutBodyDto) {
    const result = await this.sendMessage(
      NatsApi.payment.create,
      body,
    )
    return result
  }

  /**
   * 退款
   * @returns
   * @param body
   */
  async refund(body: RefundBodyDto) {
    const result = await this.sendMessage(
      NatsApi.payment.refund,
      body,
    )
    return result
  }

  /**
   * 订阅列表
   * @returns
   * @param body
   */
  async subscription(body: SubscriptionBodyDto) {
    const result = await this.sendMessage(
      NatsApi.payment.subscription,
      body,
    )
    return result
  }

  /**
   * 退订
   * @returns
   * @param body
   */
  async unsubscribe(body: UnSubscriptionBodyDto) {
    const result = await this.sendMessage(
      NatsApi.payment.unsubscribe,
      body,
    )
    return result
  }

  /**
   * stripe回调
   * @returns
   * @param body
   */
  async webhook(body: WebhookDto, prefix?: string) {
    const result = await this.sendMessage(
      NatsApi.payment.webhook,
      body,
      prefix,
    )
    return result
  }
}
