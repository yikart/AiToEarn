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
export class RefundService {
  constructor(private readonly stripe: Stripe) {}

  // 创建退款
  async create(body: Stripe.RefundCreateParams) {
    return this.stripe.refunds.create(body)
  }
}
