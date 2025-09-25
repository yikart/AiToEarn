/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Subscription } from '@yikart/mongodb'
import { ISubscriptionStatus, StripeService } from '@yikart/stripe'
import * as _ from 'lodash'
import { Model } from 'mongoose'
import { UnsubscribeDto } from './subscription.dto'

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly stripeService: StripeService,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  // 获取订阅列表
  async list(userId: string, size = 100, page = 1) {
    //  status: { $in: [ICheckoutStatus.succeeded, ICheckoutStatus.refunded] }
    const query = { userId }
    const count = await this.subscriptionModel.countDocuments(query)
    const list = await this.subscriptionModel.find(query).limit(size).skip((page - 1) * size)
    return { count, list }
  }

  // 取消订阅，取消订阅和退款无关
  async unsubscribe(body: UnsubscribeDto, isAdmin = 0) {
    const { id, userId } = body
    const query: any = { id, status: ISubscriptionStatus.active }
    if (!isAdmin)
      query.userId = userId
    const subscription = await this.subscriptionModel.findOne(_.assign(query, { status: ISubscriptionStatus.active })).lean()
    if (_.isEmpty(subscription))
      throw new BadRequestException(`未找到你的订阅，或者该订阅不可被取消订阅id: ${id}， userId: ${userId}} `)
    const result = await this.stripeService.subscription.unsubscribe(id)
      .catch((e) => { throw new BadRequestException(`订阅取消失败${e.message()} `) })
    const $set = { status: ISubscriptionStatus.canceled, info: result }
    return this.subscriptionModel.findOneAndUpdate(query, { $set }, { new: true }).lean()
  }

  // 管理员订单列表--支持搜索订阅id  userId
  async adminList(search: string, size = 100, page = 1) {
    const query: any = {}
    if (!_.isEmpty(search)) {
      const searchExample = {
        $regex: search,
        $options: 'i',
      }
      query.$or = []
      query.$or.push({ id: searchExample })
      query.$or.push({ userId: searchExample })
    }
    const count = await this.subscriptionModel.countDocuments(query)
    const list = await this.subscriptionModel.find(query).limit(size).skip((page - 1) * size)
    return { list, count }
  }
}
