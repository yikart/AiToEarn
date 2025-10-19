import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model, Types } from 'mongoose'
import { NotificationStatus, NotificationType } from '../enums'
import { Notification } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListNotificationParams extends Pagination {
  userId?: string
  type?: NotificationType
  status?: NotificationStatus
  relatedId?: string
  createdAt?: string[]
  keyword?: string
}

export class NotificationRepository extends BaseRepository<Notification> {
  constructor(
    @InjectModel(Notification.name) notificationModel: Model<Notification>,
  ) {
    super(notificationModel)
  }

  async listWithPagination(params: ListNotificationParams) {
    const { page, pageSize, userId, type, status, relatedId, createdAt, keyword } = params

    const filter: FilterQuery<Notification> = {}
    if (userId)
      filter.userId = new Types.ObjectId(userId)
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (relatedId)
      filter.relatedId = relatedId
    if (createdAt) {
      filter.createdAt = {
        $gte: createdAt[0],
        $lte: createdAt[1],
      }
    }
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ]
    }

    // 排除已删除的通知
    filter.deletedAt = { $exists: false }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async getByIdAndUserId(id: string, userId: string) {
    return await this.model.findOne({
      _id: id,
      userId,
      deletedAt: { $exists: false },
    })
  }

  async updateByIdsAsRead(notificationIds: string[], userId: string) {
    const notifications = await this.model.find({
      _id: { $in: notificationIds },
      userId,
      deletedAt: { $exists: false },
      status: NotificationStatus.Unread,
    })

    if (notifications.length === 0) {
      return { affectedCount: 0 }
    }

    const ids = notifications.map(n => n.id)
    const result = await this.model.updateMany(
      {
        _id: { $in: ids },
      },
      {
        $set: {
          status: NotificationStatus.Read,
          readAt: new Date(),
        },
      },
    )
    return { affectedCount: result.modifiedCount }
  }

  async updateByUserIdAllAsRead(userId: string) {
    const result = await this.model.updateMany(
      {
        userId,
        deletedAt: { $exists: false },
        status: NotificationStatus.Unread,
      },
      {
        $set: {
          status: NotificationStatus.Read,
          readAt: new Date(),
        },
      },
    )

    return { affectedCount: result.modifiedCount }
  }

  async deleteByIds(notificationIds: string[], userId?: string) {
    const filter: FilterQuery<Notification> = {
      _id: { $in: notificationIds },
      deletedAt: { $exists: false },
    }

    if (userId) {
      filter.userId = userId
    }

    const result = await this.model.updateMany(
      filter,
      {
        $set: {
          deletedAt: new Date(),
        },
      },
    )

    return { affectedCount: result.modifiedCount }
  }

  async countByUserIdUnread(userId: string, filter?: {
    type?: NotificationType
  }) {
    const count = await this.model.countDocuments({
      userId,
      status: NotificationStatus.Unread,
      deletedAt: { $exists: false },
      ...filter,
    })

    return { count }
  }

  async listByUserId(userId: string, status?: NotificationStatus) {
    const filter: FilterQuery<Notification> = {
      userId: new Types.ObjectId(userId),
      deletedAt: { $exists: false },
    }
    if (status)
      filter.status = status

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  override async deleteById(id: string) {
    return await this.updateById(id, {
      deletedAt: new Date(),
    })
  }
}
