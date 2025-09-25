import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  BatchDeleteDto,
  CreateNotificationsByUserDto,
  GetUnreadCountDto,
  MarkAsReadDto,
  QueryNotificationsDto,
} from './notification.dto'
import { NotificationService } from './notification.service'
import {
  NotificationVo,
  OperationResultVo,
  UnreadCountVo,
} from './notification.vo'

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name)

  constructor(private readonly notificationService: NotificationService) {}

  @NatsMessagePattern('other.notification.createForUser')
  async createForUser(@Payload() data: CreateNotificationsByUserDto) {
    const result = await this.notificationService.createForUser(data)
    return result
  }

  @NatsMessagePattern('other.notification.list')
  async getUserNotifications(@Payload() data: QueryNotificationsDto) {
    const result = await this.notificationService.findByUser(data)
    return result
  }

  @NatsMessagePattern('other.notification.detail')
  async getNotificationDetail(
    @Payload() data: { id: string, userId: string },
  ): Promise<NotificationVo> {
    const notification = await this.notificationService.findById(data.id, data.userId)
    return NotificationVo.create(notification)
  }

  @NatsMessagePattern('other.notification.markRead')
  async markAsRead(@Payload() markDto: MarkAsReadDto): Promise<OperationResultVo> {
    const result = await this.notificationService.markAsRead(markDto)
    return OperationResultVo.create(result)
  }

  @NatsMessagePattern('other.notification.markAllRead')
  async markAllAsRead(@Payload() data: { userId: string }): Promise<OperationResultVo> {
    const result = await this.notificationService.markAllAsRead(data.userId)
    return OperationResultVo.create(result)
  }

  @NatsMessagePattern('other.notification.delete')
  async deleteNotifications(@Payload() deleteDto: BatchDeleteDto): Promise<OperationResultVo> {
    const result = await this.notificationService.delete(deleteDto)
    return OperationResultVo.create(result)
  }

  @NatsMessagePattern('other.notification.unreadCount')
  async getUnreadCount(@Payload() getCountDto: GetUnreadCountDto): Promise<UnreadCountVo> {
    const result = await this.notificationService.getUnreadCount(getCountDto)
    return UnreadCountVo.create(result)
  }
}
