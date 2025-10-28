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
export class CheckoutService {
  constructor(private readonly stripe: Stripe) {}

  // 获取订单
  async getById(id: string) {
    return this.stripe.checkout.sessions.retrieve(id)
  }

  // 获取订单列表
  async list(limit = 100) {
    return this.stripe.checkout.sessions.list({ limit })
  }

  // 创建订单
  async create(body: Stripe.Checkout.SessionCreateParams) {
    return this.stripe.checkout.sessions.create(body)
  }

  // 更新订单
  async modify(body: Stripe.Checkout.SessionUpdateParams & { id: string }) {
    return this.stripe.checkout.sessions.update(body.id, body)
  }
}
