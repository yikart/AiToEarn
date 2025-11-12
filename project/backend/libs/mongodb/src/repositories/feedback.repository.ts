import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { FeedbackType } from '../enums'
import { Feedback } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListFeedbackParams extends Pagination {
  userId?: string
  type?: FeedbackType
  userName?: string
  createdAt?: string[]
  keyword?: string
}

export class FeedbackRepository extends BaseRepository<Feedback> {
  constructor(
    @InjectModel(Feedback.name) feedbackModel: Model<Feedback>,
  ) {
    super(feedbackModel)
  }

  async listWithPagination(params: ListFeedbackParams) {
    const { page, pageSize, userId, type, userName, createdAt, keyword } = params

    const filter: FilterQuery<Feedback> = {}
    if (userId)
      filter.userId = userId
    if (type)
      filter.type = type
    if (userName)
      filter.userName = userName
    if (createdAt) {
      filter.createdAt = {
        $gte: createdAt[0],
        $lte: createdAt[1],
      }
    }
    if (keyword) {
      filter.$or = [
        { content: { $regex: keyword, $options: 'i' } },
        { userName: { $regex: keyword, $options: 'i' } },
      ]
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }

  async listByUserId(userId: string) {
    return await this.find({ userId })
  }

  async listByType(type: FeedbackType) {
    return await this.find({ type })
  }
}
