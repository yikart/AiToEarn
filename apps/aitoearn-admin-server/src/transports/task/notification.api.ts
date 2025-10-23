import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../taskBase.api'
import {
  AdminDeleteNotificationsRequest,
  AdminQueryNotificationsRequest,
  CreateNotificationRequest,
} from './task.interface'

@Injectable()
export class NotificationApi extends TaskBaseApi {
  async create(data: CreateNotificationRequest): Promise<void> {
    await this.sendMessage<void>(
      'task/admin/notification/create',
      data,
    )
  }

  async list(data: AdminQueryNotificationsRequest): Promise<any> {
    return await this.sendMessage<any>(
      'task/admin/notification/list',
      data,
    )
  }

  async delete(data: AdminDeleteNotificationsRequest): Promise<any> {
    return await this.sendMessage<any>(
      'task/admin/notification/delete',
      data,
    )
  }
}
