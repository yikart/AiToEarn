import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { ICurrency } from '@yikart/stripe'
import { FilterQuery, Model } from 'mongoose'
import { Price } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListPriceParams extends Pagination {
  product?: string
  active?: boolean
  currency?: ICurrency
}

export class PriceRepository extends BaseRepository<Price> {
  constructor(
    @InjectModel(Price.name) priceModel: Model<Price>,
  ) {
    super(priceModel)
  }

  async listWithPagination(params: ListPriceParams) {
    const { page, pageSize, product, active, currency } = params

    const filter: FilterQuery<Price> = {}
    if (product)
      filter.product = product
    if (active !== undefined)
      filter.active = active
    if (currency)
      filter.currency = currency

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { unit_amount: 1 } },
    })
  }
}
