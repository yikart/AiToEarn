import { Injectable, Logger } from '@nestjs/common'
import { CheckoutRepository, SubscriptionRepository } from '@yikart/mongodb'
import { ChargeService, ICheckoutMode, ICheckoutStatus, ICurrency, ISubscriptionStatus, SubscriptionService } from '@yikart/stripe'
import _ from 'lodash'
import { IWebhookType } from './comment'
import {
  ChargeDto,
  WebhookCheckoutDto,
  WebhookDto,
} from './webhook.dto'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)
  constructor(
    private readonly subscriptionApiService: SubscriptionService,
    private readonly chargeApiService: ChargeService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  // 事件推送
  async webhook(event: WebhookDto) {
    const { type, data, created } = event
    data.object.eventCreated = created
    return this.getHandleWebHook(type, data)
  }

  async getHandleWebHook(type: IWebhookType, data: any) {
    switch (type) {
      case IWebhookType['checkout.session.completed']:
        return this.succeeded(data.object)
        break
      case IWebhookType['charge.refunded']:
        return this.refunded(data.object)
        break
      case IWebhookType['checkout.session.expired']:
        return this.expired(data.object)
        break
      case IWebhookType['customer.subscription.deleted']:
        return this.subscriptionCancel(data.object)
        break
      default:
    }
  }

  // 处理支付成功逻辑

  async succeeded(data: any) {
    this.logger.debug(data)
    // 分为订阅和一次性付款分开来处理
    const { mode } = data
    return this.getHandlePayment(mode, data)
  }

  // 根据订单的支付方式来分别处理  分为一次性支付  和   订阅
  async getHandlePayment(mode: ICheckoutMode, data: any) {
    switch (mode) {
      case ICheckoutMode.payment:
        return this.payment(data)
        break
      case ICheckoutMode.subscription:
        return this.subscription(data)
        break
      default:
    }
  }

  // 根据checkout来查找subscription，再通过subscription里面共同支付id来查找charge
  async subscription(data: WebhookCheckoutDto) {
    const {
      subscription: subscriptionId,
      id,
      eventCreated,
      metadata,
      amount_total,
    } = data
    const info
      = await this.subscriptionApiService.getSubscriptionById(subscriptionId)
    // 创建订阅
    let chargeInfo: Awaited<ReturnType<ChargeService['searchChargeByQuery']>> | undefined
    if (amount_total > 0) {
      chargeInfo = await this.chargeApiService.searchChargeByQuery(
        `customer:'${info.customer}' AND created>${eventCreated - 30}`,
      )
      const { paid, refunded } = chargeInfo || {}
      if (!paid || refunded)
        return this.logger.log('该笔订单未付款, 或者已经退款', id)
    }
    const checkout = await this.checkoutRepository.getById(id)
    const userId = _.get(checkout, 'userId')
    const { customer, created, currency } = info
    const body = {
      id: subscriptionId,
      status: ISubscriptionStatus.active,
      currency: currency as ICurrency,
      created,
      info,
      metadata,
      userId,
      customer: typeof customer === 'string' ? customer : customer.id,
    }
    await this.subscriptionRepository.upsertById(subscriptionId, body)
    return this.saveSuccessChargeToCheckout(
      chargeInfo,
      id,
      amount_total,
      subscriptionId,
    )
  }

  // 根据checkout来查找charge订单
  async payment(data: WebhookCheckoutDto) {
    const { payment_intent, id, amount_total } = data
    if (amount_total === 0) {
      return this.saveSuccessChargeToCheckout({}, id, amount_total)
    }
    const charge
      = await this.chargeApiService.searchChargeByPaymentIntent(payment_intent)
    return this.saveSuccessChargeToCheckout(charge, id, amount_total)
  }

  // 存储订单成功支付状态
  async saveSuccessChargeToCheckout(
    chargeInfo: ChargeDto | any,
    id: string,
    amount_total: number,
    subscription: string | null = null,
  ) {
    const { amount, amount_refunded, paid, refunded, id: charge } = chargeInfo
    if (amount_total > 0 && (!paid || refunded))
      return this.logger.log({ id }, '该笔订单未付款, 或者已经退款')
    const body = {
      chargeInfo,
      amount,
      amount_refunded,
      amount_total,
      charge,
      subscription,
      status: ICheckoutStatus.succeeded,
    }
    return this.checkoutRepository.updateById(id, body)
    //  toDo 发送nats 开通用户对应会员  存储积分   这块逻辑写到gateway中
  }

  // 处理退款逻辑
  async refunded(data: { id: string }) {
    const { id } = data
    const chargeInfo = await this.chargeApiService.getChargeById(id)
    const {
      amount,
      amount_refunded,
      refunded,
      id: charge,
      payment_intent,
    } = chargeInfo
    if (!refunded)
      return this.logger.log({ id }, '该笔订单未退款')
    const $set = {
      chargeInfo,
      amount,
      amount_refunded,
      charge,
      payment_intent,
      status: ICheckoutStatus.refunded,
    }
    const checkout = await this.checkoutRepository.getByChargeAndStatus(id, ICheckoutStatus.succeeded)
    if (!checkout) {
      throw new Error(
        `未找到状态为成功支付的退款订单,或者已退款，订单id为${id}`,
      )
    }
    return this.checkoutRepository.updateById(checkout.id, $set)
    // toDo 发送nats 取消会员 这块逻辑写到gateway中
  }

  // 处理订单超时
  async expired(data: any) {
    const { id } = data
    const $set = { status: ICheckoutStatus.expired }
    const checkout = await this.checkoutRepository.getByIdAndStatus(id, ICheckoutStatus.created)
    if (!checkout) {
      return null
    }
    return this.checkoutRepository.updateById(id, $set)
  }

  async subscriptionCancel(data: { id: string }) {
    const info = await this.subscriptionApiService.getSubscriptionById(data.id)
    const { status } = info
    if (status !== 'canceled')
      return
    const body = { id: data.id, status: ISubscriptionStatus.canceled, info }
    await this.subscriptionRepository.upsertById(data.id, body)
  }
}
