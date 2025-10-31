import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { ICheckoutStatus } from '@yikart/stripe'
import { FilterQuery, Model, QueryOptions } from 'mongoose'
import { Checkout } from '../schemas'
import { BaseRepository, UpdateDocumentType } from './base.repository'

export interface ListCheckoutParams extends Pagination {
  userId?: string
  customer?: string
  status?: ICheckoutStatus | ICheckoutStatus[]
  mode?: string
  createdAt?: Date[]
  search?: string
}

export class CheckoutRepository extends BaseRepository<Checkout> {
  constructor(
    @InjectModel(Checkout.name) checkoutModel: Model<Checkout>,
  ) {
    super(checkoutModel)
  }

  /**
   * 根据ID获取单个文档
   */
  override async getById(id: string, options?: QueryOptions<Checkout>) {
    return await this.model.findOne({ id }, undefined, options).exec()
  }

  async listWithPagination(params: ListCheckoutParams) {
    const { page, pageSize, userId, customer, status, mode, createdAt, search } = params

    const filter: FilterQuery<Checkout> = {}
    if (userId)
      filter.userId = userId
    if (customer)
      filter.customer = customer
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status }
      }
      else {
        filter.status = status
      }
    }
    if (mode)
      filter.mode = mode
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
        { charge: searchExample },
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

  override async updateById(
    id: string,
    update: UpdateDocumentType<Checkout>,
    options?: QueryOptions<Checkout>,
  ) {
    return super.updateOne({}, update, options)
  }

  async getByUserId(userId: string) {
    return await this.find({ userId }, { sort: { created: -1 } })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }

  async upsertById(id: string, data: Partial<Checkout>) {
    return await this.model.findOneAndUpdate({ id }, { $set: data }, { upsert: true, new: true }).exec()
  }

  async getByIdAndUserId(id: string, userId?: string) {
    const filter: FilterQuery<Checkout> = { id }
    if (userId) {
      filter.userId = userId
    }
    return await this.findOne(filter)
  }

  async getByChargeAndUserId(charge: string, userId?: string) {
    const filter: FilterQuery<Checkout> = { charge }
    if (userId) {
      filter.userId = userId
    }
    return await this.findOne(filter)
  }

  async getByChargeAndStatus(charge: string, status: ICheckoutStatus) {
    return await this.findOne({ charge, status })
  }

  async getByIdAndStatus(id: string, status: ICheckoutStatus) {
    return await this.findOne({ id, status })
  }
}
