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
export class CouponService {
  constructor(private readonly stripe: Stripe) {}

  // 创建优惠券
  async create(body: Stripe.CouponCreateParams) {
    return this.stripe.coupons.create(body)
  }

  // 删除优惠券
  async del(id: string) {
    return this.stripe.coupons.del(
      id,
    )
  }

  // 获取优惠券列表
  async getPriceList(limit = 100) {
    return this.stripe.prices.list({ limit })
  }
}
