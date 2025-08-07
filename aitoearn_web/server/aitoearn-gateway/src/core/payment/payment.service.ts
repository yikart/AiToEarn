/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import {
  ICheckoutStatus,
  IPaymentToUserVip,
} from '@transports/payment/comment'
import { PaymentNatsApi } from '@transports/payment/payment.natsApi'
import { UserVipCycleType } from '@transports/user/comment'
import { UserVipNatsApi } from '@transports/user/vip.natsApi'
import * as _ from 'lodash'
import {
  CheckoutBodyDto,
  CheckoutDto,
  CheckoutListBody,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
  WebhookDto,
} from './dto/payment.dto'

@Injectable()
export class PaymentService {
  private prefix = ''

  constructor(
    private readonly paymentNatsApi: PaymentNatsApi,
    private readonly userVipNatsApi: UserVipNatsApi,
  ) {}

  // 获取订单
  async getById(id: string, userId: string) {
    return this.paymentNatsApi.getById(id, userId)
  }

  // 获取价格列表
  async list(body: CheckoutListBody) {
    return this.paymentNatsApi.list(body)
  }

  // 创建订单 // 每笔订单最低总价格必须大约0.5美元
  async create(body: CheckoutBodyDto) {
    return this.paymentNatsApi.create(body)
  }

  // 订单退款 // 每笔订单最低总价格必须大约0.5美元
  async refund(body: RefundBodyDto) {
    return this.paymentNatsApi.refund(body)
  }

  // 订阅列表
  async subscription(body: SubscriptionBodyDto) {
    return this.paymentNatsApi.subscription(body)
  }

  // 退订
  async unsubscribe(body: UnSubscriptionBodyDto) {
    return this.paymentNatsApi.unsubscribe(body)
  }

  // 回调接口处理会员
  async webhook(body: WebhookDto) {
    const data: any = await this.paymentNatsApi.webhook(body)
    Logger.log('打印返回值', data)
    if (_.isEmpty(data) || !_.get(data, 'status'))
      return
    // 根据订单情况处理退款 // 续费
    const { status } = data
    return this.getHandleStatus(status, data)
  }

  // 根据订单的支付方式来分别处理  分为一次性支付  和   订阅
  async getHandleStatus(status: ICheckoutStatus, data: CheckoutDto) {
    const { userId, metadata } = data
    const { payment } = metadata
    Logger.log(JSON.stringify(data), payment, userId)
    if (!payment)
      return
    switch (status) {
      case ICheckoutStatus.succeeded:
        return this.userVipNatsApi.setUserVipInfo(
          userId,
          IPaymentToUserVip[payment],
        )
      case ICheckoutStatus.refunded:
        return this.userVipNatsApi.setUserVipInfo(
          userId,
          UserVipCycleType.NONE,
        )
      default:
    }
  }
}
