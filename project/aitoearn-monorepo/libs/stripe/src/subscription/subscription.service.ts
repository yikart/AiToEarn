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
export class SubscriptionService {
  constructor(private readonly stripe: Stripe) {}

  // 查询订阅
  async getSubscriptionById(id: string) {
    return this.stripe.subscriptions.retrieve(id)
  }

  // 取消订阅
  async unsubscribe(id: string) {
    return this.stripe.subscriptions.cancel(id)
  }

  // 获取订阅列表
  async list(limit = 1000) {
    return this.stripe.refunds.list({ limit })
  }
}
