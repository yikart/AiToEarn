import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { CheckoutBodyDto, CheckoutListBody, RefundBodyDto, SubscriptionBodyDto, UnSubscriptionBodyDto, WebhookDto } from '../dto/payment.dto'

@Injectable()
export class PaymentNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 获取订单列表
   * @returns
   * @param body
   */
  async list(body: CheckoutListBody) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.payment.baseUrl}/payment/list`,
      body,
    )
    return res.data
  }

  /**
   * 查询订单
   * @returns
   * @param id
   * @param userId
   */
  async getById(id: string, userId: string) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.payment.baseUrl}/payment/getById`,
      { id, userId },
    )
    return res.data
  }

  /**
   * 创建订单
   * @returns
   * @param body
   */
  async create(body: CheckoutBodyDto) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.payment.baseUrl}/payment/create`,
      body,
    )
    return res.data
  }

  /**
   * 退款
   * @returns
   * @param body
   */
  async refund(body: RefundBodyDto) {
    const res = await this.httpService.axiosRef.post<string>(
      `${config.payment.baseUrl}/payment/refund`,
      body,
    )
    return res.data
  }

  /**
   * 订阅列表
   * @returns
   * @param body
   */
  async subscription(body: SubscriptionBodyDto) {
    const res = await this.httpService.axiosRef.post(
      `${config.payment.baseUrl}/payment/subscription`,
      body,
    )
    return res.data
  }

  /**
   * 退订
   * @returns
   * @param body
   */
  async unsubscribe(body: UnSubscriptionBodyDto) {
    const res = await this.httpService.axiosRef.post(
      `${config.payment.baseUrl}/payment/unsubscribe`,
      body,
    )
    return res.data
  }

  /**
   * stripe回调
   * @returns
   * @param body
   */
  async webhook(body: WebhookDto) {
    const res = await this.httpService.axiosRef.post(
      `${config.payment.baseUrl}/payment/webhook`,
      body,
    )
    return res.data
  }
}
