import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { Product } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListProductParams extends Pagination {
  name?: string
  active?: boolean
}

export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectModel(Product.name) productModel: Model<Product>,
  ) {
    super(productModel)
  }

  async listWithPagination(params: ListProductParams) {
    const { page, pageSize, name, active } = params

    const filter: FilterQuery<Product> = {}
    if (name)
      filter.name = { $regex: name, $options: 'i' }
    if (active !== undefined)
      filter.active = active

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { name: 1 } },
    })
  }
}
