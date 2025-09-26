/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable } from '@nestjs/common'
import { SubscriptionRepository } from '@yikart/mongodb'
import { ISubscriptionStatus, StripeService } from '@yikart/stripe'
import * as _ from 'lodash'
import { UnsubscribeDto } from './subscription.dto'

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  // 获取订阅列表
  async list(userId: string, size = 100, page = 1) {
    const [list, count] = await this.subscriptionRepository.listWithPagination({
      page,
      pageSize: size,
      userId,
    })
    return { count, list }
  }

  // 取消订阅，取消订阅和退款无关
  async unsubscribe(body: UnsubscribeDto, isAdmin = 0) {
    const { id, userId } = body

    let subscription
    if (!isAdmin) {
      if (!userId) {
        throw new BadRequestException('userId is required')
      }
      subscription = await this.subscriptionRepository.getByUserIdAndStatus(userId, ISubscriptionStatus.active)
    }
    else {
      subscription = await this.subscriptionRepository.getByIdAndStatus(id, ISubscriptionStatus.active)
    }

    if (_.isEmpty(subscription))
      throw new BadRequestException(`未找到你的订阅，或者该订阅不可被取消订阅id: ${id}， userId: ${userId}} `)
    const result = await this.stripeService.subscription.unsubscribe(id)
      .catch((e) => { throw new BadRequestException(`订阅取消失败${e.message()} `) })
    const $set = { status: ISubscriptionStatus.canceled, info: result }
    return this.subscriptionRepository.updateById(subscription.id, $set)
  }

  // 管理员订单列表--支持搜索订阅id  userId
  async adminList(search: string, size = 100, page = 1) {
    const [list, count] = await this.subscriptionRepository.listWithPagination({
      page,
      pageSize: size,
      search: search || undefined,
    })
    return { list, count }
  }
}
