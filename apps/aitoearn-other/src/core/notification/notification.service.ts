import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { NotificationRepository, NotificationStatus, NotificationType } from '@yikart/mongodb'
import {
  AdminBatchDeleteDto,
  AdminQueryNotificationsDto,
  BatchDeleteDto,
  GetUnreadCountDto,
  MarkAsReadDto,
  QueryNotificationsDto,
} from './notification.dto'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

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

  async findByUser(queryDto: QueryNotificationsDto) {
    return await this.notificationRepository.listWithPagination({
      page: queryDto.page,
      pageSize: queryDto.pageSize,
      userId: queryDto.userId,
      status: queryDto.status,
      type: queryDto.type,
    })
  }

  async findAll(queryDto: AdminQueryNotificationsDto) {
    return await this.notificationRepository.listWithPagination({
      page: queryDto.pageNo,
      pageSize: queryDto.pageSize,
      userId: queryDto.userId,
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

  async markAsRead(markDto: MarkAsReadDto) {
    return await this.notificationRepository.updateByIdsAsRead(markDto.notificationIds, markDto.userId)
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepository.updateByUserIdAllAsRead(userId)
  }

  async delete(deleteDto: BatchDeleteDto) {
    return await this.notificationRepository.deleteByIds(deleteDto.notificationIds, deleteDto.userId)
  }

  async adminDelete(deleteDto: AdminBatchDeleteDto) {
    return await this.notificationRepository.deleteByIds(deleteDto.notificationIds)
  }

  async getUnreadCount(getCountDto: GetUnreadCountDto) {
    return await this.notificationRepository.countByUserIdUnread(getCountDto.userId)
  }
}
