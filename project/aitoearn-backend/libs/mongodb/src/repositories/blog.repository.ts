import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { Blog } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListBlogParams extends Pagination {
  keyword?: string
  createdAt?: Date[]
}

export class BlogRepository extends BaseRepository<Blog> {
  constructor(
    @InjectModel(Blog.name) blogModel: Model<Blog>,
  ) {
    super(blogModel)
  }

  async listWithPagination(params: ListBlogParams) {
    const { page, pageSize, keyword, createdAt } = params

    const filter: FilterQuery<Blog> = {}
    if (createdAt) {
      filter.createdAt = {
        $gte: createdAt[0],
        $lte: createdAt[1],
      }
    }
    if (keyword) {
      filter.content = { $regex: keyword, $options: 'i' }
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }
}
