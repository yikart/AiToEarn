import { InjectModel } from '@nestjs/mongoose'
import { AccountType, Pagination, RangeFilter, UserType } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { PublishedPost } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListPostsFilter {
  accountId?: string
  userId?: string
  platform?: AccountType
  uid?: string
  period?: RangeFilter<Date>
}

export interface ListPostsWithPaginationFilter extends Pagination, ListPostsFilter {}
export class PublishedPostRepository extends BaseRepository<PublishedPost> {
  constructor(
    @InjectModel(PublishedPost.name) publishedPostModel: Model<PublishedPost>,
  ) {
    super(publishedPostModel)
  }

  private buildFilter(filterParams: ListPostsFilter) {
    const { accountId, userId, platform, uid, period } = filterParams
    const filter: FilterQuery<PublishedPost> = {}
    if (accountId)
      filter.accountId = accountId
    if (userId)
      filter.userId = userId
    if (platform)
      filter.platform = platform
    if (uid)
      filter.uid = uid
    if (period) {
      filter.publishTime = {}
      if (period[0])
        filter.publishTime.$gte = period[0]
      if (period[1])
        filter.publishTime.$lte = period[1]
    }
    return filter
  }

  async listWithPagination(filterParams: ListPostsWithPaginationFilter) {
    const { page, pageSize } = filterParams

    const filter: FilterQuery<PublishedPost> = this.buildFilter(filterParams)
    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { publishTime: -1 } },
    })
  }

  async list(filterParams: ListPostsFilter) {
    const filter: FilterQuery<PublishedPost> = this.buildFilter(filterParams)
    return await this.find(filter, { sort: { publishTime: -1 } })
  }

  async getPostByPostId(postId: string) {
    return await this.findOne({ postId })
  }
}
