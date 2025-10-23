import { Injectable } from '@nestjs/common'
import {
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
} from '../../core/payment/dto/payment.dto'
import { PaymentBaseApi } from '../paymentBase.api'

@Injectable()
export class PaymentApi extends PaymentBaseApi {
  /**
   * 获取订单列表
   * @returns
   * @param body
   */
  async list(body: { page: number, size: number, search?: string }) {
    const result = await this.sendMessage<string>(
      'payment/admin/heckout/list',
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
      'admin/payment/refund',
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
      'admin/payment/subscription',
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
      'admin/payment/subscription',
      body,
    )
    return result
  }
}
