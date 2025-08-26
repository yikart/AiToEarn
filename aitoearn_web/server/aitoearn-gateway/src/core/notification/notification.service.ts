import { Injectable } from '@nestjs/common'
import { NotificationNatsApi } from '@transports/notification/notification.natsApi'
import {
  BatchDeleteDto,
  GetUnreadCountDto,
  MarkAsReadDto,
  QueryNotificationsDto,
} from './notification.dto'

@Injectable()
export class NotificationService {
  constructor(private readonly notificationNatsApi: NotificationNatsApi) {}

  async getUserNotifications(userId: string, queryDto: QueryNotificationsDto) {
    const queryData = {
      userId,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
      status: queryDto.status,
      type: queryDto.type,
    }

    return await this.notificationNatsApi.getUserNotifications(queryData)
  }

  async getNotificationDetail(id: string, userId: string) {
    const data = { id, userId }
    return await this.notificationNatsApi.getNotificationDetail(data)
  }

  async markAsRead(userId: string, markDto: MarkAsReadDto) {
    const markData = {
      userId,
      notificationIds: markDto.notificationIds,
    }

    return await this.notificationNatsApi.markAsRead(markData)
  }

  async markAllAsRead(userId: string) {
    const data = { userId }
    return await this.notificationNatsApi.markAllAsRead(data)
  }

  async deleteNotifications(userId: string, deleteDto: BatchDeleteDto) {
    const deleteData = {
      userId,
      notificationIds: deleteDto.notificationIds,
    }

    return await this.notificationNatsApi.deleteNotifications(deleteData)
  }

  async getUnreadCount(userId: string, countDto: GetUnreadCountDto) {
    const data = {
      userId,
      type: countDto.type,
    }

    return await this.notificationNatsApi.getUnreadCount(data)
  }
}
