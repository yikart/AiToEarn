/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import { Stripe } from 'stripe'
import { StripeConfig } from '../stripe.config'

@Injectable()
export class ChargeService {
  private readonly logger = new Logger(ChargeService.name)
  constructor(private readonly stripe: Stripe, private readonly config: StripeConfig) {}
  // 获取订单
  async getChargeById(id: string) {
    return this.stripe.charges.retrieve(id)
  }

  // 获取订单通过payment_intent
  async searchChargeByQuery(query: string) {
    const result = await this.stripe.charges.search({ query })
    this.logger.debug({
      result,
    })
    return result?.data?.at(0)
  }

  // 获取订单通过payment_intent
  async searchChargeByPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
    const { latest_charge } = paymentIntent
    if (latest_charge == null) {
      return
    }
    if (typeof latest_charge === 'string') {
      return this.stripe.charges.retrieve(latest_charge)
    }
    else {
      return this.stripe.charges.retrieve(latest_charge.id)
    }
  }

  // 获取订单列表
  async list(limit = 100) {
    return this.stripe.charges.list({ limit })
  }

  // 验证签名
  async verify(body: any, sig: string) {
    return this.stripe.webhooks.constructEvent(JSON.stringify(body), sig, this.config.endpointSecret)
  }
}
