/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import { CheckoutRepository } from '@yikart/mongodb'
import { ICheckoutMode, ICheckoutStatus, IPayment, IPaymentToMode, IPriceId, StripeService } from '@yikart/stripe'
import _ from 'lodash'
import { config } from '../../../config'
import { CheckoutBodyDto, CheckoutDto, LineItemsDto } from './checkout.dto'

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name)
  constructor(
    private readonly stripeService: StripeService,
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  // 获取订单
  async getById(id: string, userId?: string) {
    const result = await this.checkoutRepository.getByIdAndUserId(id, userId)
    return result
  }

  // 获取订单列表
  async list(userId: string, size = 100, page = 1) {
    const [list, count] = await this.checkoutRepository.listWithPagination({
      page,
      pageSize: size,
      userId,
      status: [ICheckoutStatus.succeeded, ICheckoutStatus.refunded],
    })
    return { list, count }
  }

  // 创建订单 // 每笔订单最低总价格必须大于0.5美元
  async create(body: CheckoutBodyDto) {
    const { success_url, payment, metadata, discounts, flagTrialPeriodDays } = body
    const quantity = payment === IPayment.points ? body.quantity : 1
    const { userId } = metadata
    const mode = IPaymentToMode[payment]
    const price: string = IPriceId[mode][payment]
    const line_items: LineItemsDto[] = [{
      price,
      quantity,
    }]
    // 创建订单需要根据前端的需求来构建订单参数
    const data: CheckoutDto = { allow_promotion_codes: true, success_url, line_items, mode, metadata: _.assign(metadata, { payment, mode }), discounts }
    // 是订阅的话给一个免费七天的延迟付款时长
    if (mode === ICheckoutMode.subscription && flagTrialPeriodDays) {
      const trial_period_days = config.stripe.trial_period_days
      const subscription_data = { trial_period_days }
      Object.assign(data, { subscription_data })
    }
    this.logger.log(data, 'create order')
    const info = await this.stripeService.checkout.create(data)
    const { id, payment_intent, subscription, customer, customer_details, created, expires_at, url, currency, amount_total } = info
    let checkout = {
      userId,
      mode,
      id,
      price,
      metadata: data.metadata,
      payment_intent,
      subscription,
      customer,
      customer_details,
      info,
      success_url,
      created,
      expires_at,
      quantity,
      url,
      currency,
      amount: amount_total,
    }
    checkout = await this.checkoutRepository.upsertById(id, checkout)
    return checkout
  }

  // 管理员订单列表--支持搜索订单id  cahrgeid   userId
  async adminList(search: string, size = 100, page = 1) {
    const [list, count] = await this.checkoutRepository.listWithPagination({
      page,
      pageSize: size,
      status: [ICheckoutStatus.succeeded, ICheckoutStatus.refunded],
      search: _.isEmpty(search) ? undefined : search,
    })
    return { list, count }
  }
}
