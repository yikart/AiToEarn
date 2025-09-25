/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Checkout } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import * as _ from 'lodash'
import { Model } from 'mongoose'
import { RefundBodyDto } from './refund.dto'

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name)

  constructor(
    private readonly stripeService: StripeService,
    @InjectModel(Checkout.name) private checkoutModel: Model<Checkout>,
  ) { }

  // 创建退款
  async create(body: RefundBodyDto, isAdmin = 0) {
    const { charge, userId } = body
    // 验证该用户是否有有权限来操作退款  需本人退款  超管的逻辑后面再加
    const filter = isAdmin ? { charge } : { userId, charge }
    const checkout: Checkout | null = await this.checkoutModel.findOne(filter)
    // 权限不够或者找不到 charge
    if (_.isEmpty(checkout))
      return
    const result = await this.stripeService.refund.create({ charge })
    this.logger.log(result)
    return result
  }
}
