import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '@yikart/mongodb'
import {
  AdminDeleteNotificationsDto,
  AdminQueryNotificationsDto,
  CreateNotificationDto,
} from './notification.dto'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationNatsApi: NotificationApi,
    private readonly notificationRepository: NotificationRepository,
  ) { }

  async create(createDto: CreateNotificationDto): Promise<void> {
    await this.notificationRepository.create(createDto)
  }

  async list(queryDto: AdminQueryNotificationsDto) {
    const filter = {
      ...queryDto,
      page: queryDto.pageNo || 1,
      pageSize: queryDto.pageSize || 10,
    }
    delete filter.pageNo
    return await this.notificationRepository.listWithPagination(filter)
  }

  async delete(deleteDto: AdminDeleteNotificationsDto) {
    return await this.notificationNatsApi.delete(deleteDto)
  }
}
