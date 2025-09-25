/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable, Logger } from '@nestjs/common'
import { StripeService } from '@yikart/stripe'

@Injectable()
export class ChargeService {
  private readonly logger = new Logger(ChargeService.name)

  constructor(
    private readonly stripeService: StripeService,
  ) { }

  // 获取订单
  async getChargeById(id: string) {
    const result = await this.stripeService.charge.getChargeById(id)
    this.logger.log(result)
    return result
  }

  // 获取订单列表
  async list(userId: string, size = 100, page = 1) {
    const result = await this.stripeService.charge.list(size)
    this.logger.log({ result, userId, page })
    return result
    // const count = this.checkoutModel.countDocuments({ userId })
    // const list = this.checkoutModel.find({ userId }).limit(size).skip((page - 1) * size)
    // return bluebird.props({ list, count })
  }
}
