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
  search?: string
}

export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor(
    @InjectModel(Subscription.name) subscriptionModel: Model<Subscription>,
  ) {
    super(subscriptionModel)
  }

  async listWithPagination(params: ListSubscriptionParams) {
    const { page, pageSize, userId, customer, status, currency, createdAt, search } = params

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
    if (search) {
      const searchExample = {
        $regex: search,
        $options: 'i',
      }
      filter.$or = [
        { id: searchExample },
        { userId: searchExample },
      ]
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { created: -1 } },
    })
  }

  async listByUserId(userId: string) {
    return await this.find({ userId }, { sort: { created: -1 } })
  }

  async getByUserIdAndStatus(userId: string, status: ISubscriptionStatus) {
    return await this.findOne({ userId, status })
  }

  async getByIdAndStatus(id: string, status: ISubscriptionStatus) {
    return await this.findOne({ id, status })
  }

  async upsertById(id: string, data: Partial<Subscription>) {
    return await this.model.findOneAndUpdate({ id }, { $set: data }, { upsert: true, new: true }).exec()
  }

  async countByFilter(filter: FilterQuery<Subscription>) {
    return await this.count(filter)
  }
}
