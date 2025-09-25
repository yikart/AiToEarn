/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Coupon } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import { Model } from 'mongoose'
import { CouponDto } from './coupon.dto'

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name)

  constructor(
    private readonly stripeService: StripeService,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
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
    coupon = await this.couponModel.findOneAndUpdate({ id }, coupon, { upsert: true, new: true })
    return coupon
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 删除优惠券
  async del(id: string) {
    const result = await this.stripeService.coupon.del(id)
      .catch((e) => {
        throw new BadRequestException(`删除产品失败${e.message()} `)
      })
    return result ? this.couponModel.deleteOne({ id }) : { message: '删除优惠券失败' }
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 获取优惠券列表
  async list(size = 100, page = 1) {
    const count = await this.couponModel.countDocuments()
    const list = await this.couponModel.find().limit(size).skip((page - 1) * size)
    return { list, count }
  }
}
