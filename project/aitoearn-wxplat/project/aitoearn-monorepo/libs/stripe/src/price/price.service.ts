/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable } from '@nestjs/common'
import { Stripe } from 'stripe'

@Injectable()
export class PriceService {
  constructor(private readonly stripe: Stripe) {}

  // 获取价格信息
  async getPriceById(id: string) {
    return this.stripe.prices.retrieve(id)
  }

  // 创建价格
  async create(body: Stripe.PriceCreateParams) {
    return this.stripe.prices.create(body)
  }

  // 更新价格
  async modify(id: string, body: Stripe.PriceUpdateParams) {
    return this.stripe.prices.update(
      id,
      body,
    )
  }

  // 获取价格列表
  async getPriceList(limit = 100) {
    return this.stripe.prices.list({ limit })
  }

  // 创建付款方式
  async payment(body: Stripe.PaymentMethodCreateParams) {
    return this.stripe.paymentMethods.create(
      body,
    )
  }
}
