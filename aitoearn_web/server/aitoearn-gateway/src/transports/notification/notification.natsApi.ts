import {
  NotificationDetail,
  NotificationListResult,
  OperationResult,
  UnreadCountResult,
} from '@core/notification/notification.interface'
import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class NotificationNatsApi extends BaseNatsApi {
  async getUserNotifications(queryData: {
    userId: string
    page: number
    pageSize: number
    status?: string
    type?: string
  }): Promise<NotificationListResult> {
    return await this.sendMessage<NotificationListResult>(
      NatsApi.task.notification.list,
      queryData,
    )
  }

  async getNotificationDetail(data: {
    id: string
    userId: string
  }): Promise<NotificationDetail> {
    return await this.sendMessage<NotificationDetail>(
      NatsApi.task.notification.detail,
      data,
    )
  }

  async markAsRead(markData: {
    userId: string
    notificationIds: string[]
  }): Promise<OperationResult> {
    return await this.sendMessage<OperationResult>(
      NatsApi.task.notification.markRead,
      markData,
    )
  }

  async markAllAsRead(data: { userId: string }): Promise<OperationResult> {
    return await this.sendMessage<OperationResult>(
      NatsApi.task.notification.markAllRead,
      data,
    )
  }

  async deleteNotifications(deleteData: {
    userId: string
    notificationIds: string[]
  }): Promise<OperationResult> {
    return await this.sendMessage<OperationResult>(
      NatsApi.task.notification.delete,
      deleteData,
    )
  }

  async getUnreadCount(data: {
    userId: string
    type?: string
  }): Promise<UnreadCountResult> {
    return await this.sendMessage<UnreadCountResult>(
      NatsApi.task.notification.unreadCount,
      data,
    )
  }
}
