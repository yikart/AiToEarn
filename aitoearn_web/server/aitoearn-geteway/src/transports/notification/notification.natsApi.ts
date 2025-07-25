import {
  NotificationDetail,
  NotificationListResult,
  OperationResult,
  UnreadCountResult,
} from '@core/notification/notification.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { NatsService } from '@transports/nats.service'

@Injectable()
export class NotificationNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async getUserNotifications(queryData: {
    userId: string
    page: number
    pageSize: number
    status?: string
    type?: string
  }): Promise<NotificationListResult> {
    return await this.natsService.sendMessage<NotificationListResult>(
      NatsApi.task.notification.list,
      queryData,
    )
  }

  async getNotificationDetail(data: {
    id: string
    userId: string
  }): Promise<NotificationDetail> {
    return await this.natsService.sendMessage<NotificationDetail>(
      NatsApi.task.notification.detail,
      data,
    )
  }

  async markAsRead(markData: {
    userId: string
    notificationIds: string[]
  }): Promise<OperationResult> {
    return await this.natsService.sendMessage<OperationResult>(
      NatsApi.task.notification.markRead,
      markData,
    )
  }

  async markAllAsRead(data: { userId: string }): Promise<OperationResult> {
    return await this.natsService.sendMessage<OperationResult>(
      NatsApi.task.notification.markAllRead,
      data,
    )
  }

  async deleteNotifications(deleteData: {
    userId: string
    notificationIds: string[]
  }): Promise<OperationResult> {
    return await this.natsService.sendMessage<OperationResult>(
      NatsApi.task.notification.delete,
      deleteData,
    )
  }

  async getUnreadCount(data: {
    userId: string
    type?: string
  }): Promise<UnreadCountResult> {
    return await this.natsService.sendMessage<UnreadCountResult>(
      NatsApi.task.notification.unreadCount,
      data,
    )
  }
}
