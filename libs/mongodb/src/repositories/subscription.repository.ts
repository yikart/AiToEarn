import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { ICurrency, ISubscriptionStatus } from '@yikart/stripe'
import { FilterQuery, Model } from 'mongoose'
import { Subscription } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListSubscriptionParams extends Pagination {
  userId?: string
  customer?: string
  status?: ISubscriptionStatus
  currency?: ICurrency
  createdAt?: Date[]
}

export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor(
    @InjectModel(Subscription.name) subscriptionModel: Model<Subscription>,
  ) {
    super(subscriptionModel)
  }

  async listWithPagination(params: ListSubscriptionParams) {
    const { page, pageSize, userId, customer, status, currency, createdAt } = params

    const filter: FilterQuery<Subscription> = {}
    if (userId)
      filter.userId = userId
    if (customer)
      filter.customer = customer
    if (status)
      filter.status = status
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
