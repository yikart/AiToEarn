import { InjectModel } from '@nestjs/mongoose'
import { Pagination, UserType } from '@yikart/common'
import { FilterQuery, Model, Types } from 'mongoose'
import { NotificationStatus, NotificationType } from '../enums'
import { Notification } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListNotificationParams extends Pagination {
  userId?: string
  userType?: UserType
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
    const { page, pageSize, userId, userType, type, status, relatedId, createdAt, keyword } = params

    const filter: FilterQuery<Notification> = {
      deletedAt: { $exists: false },
      ...(userType && { userType }),
      ...(userId && { userId: new Types.ObjectId(userId) }),
      ...(type && { type }),
      ...(status && { status }),
      ...(relatedId && { relatedId }),
      ...(createdAt && { createdAt: { $gte: createdAt[0], $lte: createdAt[1] } }),
      ...(keyword && { $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ] }),
    }

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

  async countByUserTypeUnreadAdmin() {
    const count = await this.model.countDocuments({
      userType: UserType.Admin,
      status: NotificationStatus.Unread,
      deletedAt: { $exists: false },
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
