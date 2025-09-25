import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { ICheckoutStatus } from '@yikart/stripe'
import { FilterQuery, Model } from 'mongoose'
import { Checkout } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListCheckoutParams extends Pagination {
  userId?: string
  customer?: string
  status?: ICheckoutStatus
  mode?: string
  createdAt?: Date[]
}

export class CheckoutRepository extends BaseRepository<Checkout> {
  constructor(
    @InjectModel(Checkout.name) checkoutModel: Model<Checkout>,
  ) {
    super(checkoutModel)
  }

  async listWithPagination(params: ListCheckoutParams) {
    const { page, pageSize, userId, customer, status, mode, createdAt } = params

    const filter: FilterQuery<Checkout> = {}
    if (userId)
      filter.userId = userId
    if (customer)
      filter.customer = customer
    if (status)
      filter.status = status
    if (mode)
      filter.mode = mode
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

  async getByUserId(userId: string) {
    return await this.find({ userId }, { sort: { created: -1 } })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }
}
