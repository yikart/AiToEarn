import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { NotificationRepository, NotificationStatus, NotificationType } from '@yikart/mongodb'
import {
  BatchDeleteDto,
  MarkAsReadDto,
  QueryNotificationsDto,
} from './notification.dto'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) { }

  async createForUser(data: {
    userId: string
    title: string
    content: string
    type: NotificationType
    relatedId: string
    data?: Record<string, unknown>
  }) {
    const { userId, title, content, type, relatedId } = data
    const saved = await this.notificationRepository.create({
      userId,
      title,
      content,
      type,
      relatedId,
      data,
      status: NotificationStatus.Unread,
    })

    return saved
  }

  async findByUser(userId: string, queryDto: QueryNotificationsDto) {
    return await this.notificationRepository.listWithPagination({
      userId,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
      status: queryDto.status,
      type: queryDto.type,
    })
  }

  async findById(id: string, userId: string) {
    const notification = await this.notificationRepository.getByIdAndUserId(id, userId)

    if (!notification) {
      throw new AppException(ResponseCode.NotificationNotFound)
    }

    return notification
  }

  async markAsRead(userId: string, markDto: MarkAsReadDto) {
    return await this.notificationRepository.updateByIdsAsRead(markDto.notificationIds, userId)
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepository.updateByUserIdAllAsRead(userId)
  }

  async delete(userId: string, deleteDto: BatchDeleteDto) {
    return await this.notificationRepository.deleteByIds(deleteDto.notificationIds, userId)
  }

  async getUnreadCount(userId: string, filter?: {
    type?: NotificationType
  }) {
    return await this.notificationRepository.countByUserIdUnread(userId, filter)
  }
}
