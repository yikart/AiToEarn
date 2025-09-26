/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { CouponRepository } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import { CouponDto } from './coupon.dto'

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name)

  constructor(
    private readonly stripeService: StripeService,
    private readonly couponRepository: CouponRepository,
  ) {
  }

  // 创建优惠券
  async create(body: CouponDto) {
    const result = await this.stripeService.coupon.create(body)
      .catch((e) => {
        throw new BadRequestException(`创建优惠券失败${e.message()} `)
      })
    const { id, created, currency, duration, percent_off } = result
    let coupon = { id, created, currency, duration, percent_off }
    coupon = await this.couponRepository.upsertById(id, coupon)
    return coupon
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 删除优惠券
  async del(id: string) {
    const result = await this.stripeService.coupon.del(id)
      .catch((e) => {
        throw new BadRequestException(`删除产品失败${e.message()} `)
      })
    return result ? this.couponRepository.deleteById(id) : { message: '删除优惠券失败' }
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 获取优惠券列表
  async list(size = 100, page = 1) {
    const [list, count] = await this.couponRepository.listWithPagination({
      page,
      pageSize: size,
    })
    return { list, count }
  }
}
