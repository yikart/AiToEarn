/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import { CheckoutRepository } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import * as _ from 'lodash'
import { RefundBodyDto } from './refund.dto'

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name)

  constructor(
    private readonly stripeService: StripeService,
    private readonly checkoutRepository: CheckoutRepository,
  ) { }

  // 创建退款
  async create(body: RefundBodyDto, isAdmin = 0) {
    const { charge, userId } = body
    // 验证该用户是否有有权限来操作退款  需本人退款  超管的逻辑后面再加
    const checkout = await this.checkoutRepository.getByChargeAndUserId(charge, isAdmin ? undefined : userId)
    // 权限不够或者找不到 charge
    if (_.isEmpty(checkout))
      return
    const result = await this.stripeService.refund.create({ charge })
    this.logger.log(result)
    return result
  }
}
