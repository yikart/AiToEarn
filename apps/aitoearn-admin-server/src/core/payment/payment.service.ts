/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { PaymentApi } from '../../transports/payment/payment.api'
import {
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
} from './dto/payment.dto'

@Injectable()
export class PaymentService {
  constructor(private readonly paymentApi: PaymentApi) {}

  // 获取价格列表
  async list(page: TableDto, query: { keyword?: string }) {
    return this.paymentApi.list({
      page: page.pageNo,
      size: page.pageSize,
      search: query.keyword,
    })
  }

  // 订单退款 // 每笔订单最低总价格必须大约0.5美元
  async refund(body: RefundBodyDto) {
    return this.paymentApi.refund(body)
  }

  // 订阅列表
  async subscription(body: SubscriptionBodyDto) {
    return this.paymentApi.subscription(body)
  }

  // 退订
  async unsubscribe(body: UnSubscriptionBodyDto) {
    return this.paymentApi.unsubscribe(body)
  }
}
