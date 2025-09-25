import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { ICurrency, IDuration } from '@yikart/stripe'
import { FilterQuery, Model } from 'mongoose'
import { Coupon } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListCouponParams extends Pagination {
  duration?: IDuration
  currency?: ICurrency
  createdAt?: Date[]
}

export class CouponRepository extends BaseRepository<Coupon> {
  constructor(
    @InjectModel(Coupon.name) couponModel: Model<Coupon>,
  ) {
    super(couponModel)
  }

  async listWithPagination(params: ListCouponParams) {
    const { page, pageSize, duration, currency, createdAt } = params

    const filter: FilterQuery<Coupon> = {}
    if (duration)
      filter.duration = duration
    if (currency)
      filter.currency = currency
    if (createdAt) {
      filter.created = {
        $gte: Math.floor(createdAt[0].getTime() / 1000),
        $lte: Math.floor(createdAt[1].getTime() / 1000),
      }
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { created: -1 } },
    })
  }
}
