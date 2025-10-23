import { Injectable } from '@nestjs/common'
import { CheckoutBodyDto, CheckoutListBody, RefundBodyDto, SubscriptionBodyDto, UnSubscriptionBodyDto, WebhookDto } from '../../payment/dto/payment.dto'
import { PaymentBaseApi } from '../paymentBase.api'

@Injectable()
export class PaymentNatsApi extends PaymentBaseApi {
  /**
   * 获取订单列表
   * @returns
   * @param body
   */
  async list(body: CheckoutListBody) {
    const res = await this.sendMessage<string>(
      `payment/list`,
      body,
    )
    return res
  }

  /**
   * 查询订单
   * @returns
   * @param id
   * @param userId
   */
  async getById(id: string, userId: string) {
    const res = await this.sendMessage<string>(
      `payment/getById`,
      { id, userId },
    )
    return res
  }

  /**
   * 创建订单
   * @returns
   * @param body
   */
  async create(body: CheckoutBodyDto) {
    const res = await this.sendMessage<string>(
      `payment/create`,
      body,
    )
    return res
  }

  /**
   * 退款
   * @returns
   * @param body
   */
  async refund(body: RefundBodyDto) {
    const res = await this.sendMessage<string>(
      `payment/refund`,
      body,
    )
    return res
  }

  /**
   * 订阅列表
   * @returns
   * @param body
   */
  async subscription(body: SubscriptionBodyDto) {
    const res = await this.sendMessage(
      `payment/subscription`,
      body,
    )
    return res
  }

  /**
   * 退订
   * @returns
   * @param body
   */
  async unsubscribe(body: UnSubscriptionBodyDto) {
    const res = await this.sendMessage(
      `payment/unsubscribe`,
      body,
    )
    return res
  }

  /**
   * stripe回调
   * @returns
   * @param body
   */
  async webhook(body: WebhookDto) {
    const res = await this.sendMessage(
      `payment/webhook`,
      body,
    )
    return res
  }
}
