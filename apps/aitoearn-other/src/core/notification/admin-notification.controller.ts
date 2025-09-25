import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  AdminBatchDeleteDto,
  AdminQueryNotificationsDto,
} from './notification.dto'
import { NotificationService } from './notification.service'
import {
  NotificationListVo,
  OperationResultVo,
} from './notification.vo'

@Controller()
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @NatsMessagePattern('other.admin.notification.list')
  async getAllNotifications(@Payload() query: AdminQueryNotificationsDto): Promise<NotificationListVo> {
    const [list, total] = await this.notificationService.findAll(query)
    return new NotificationListVo(list, total, {
      page: query.pageNo,
      pageSize: query.pageSize,
    })
  }

  @NatsMessagePattern('other.admin.notification.delete')
  async adminDeleteNotifications(@Payload() deleteDto: AdminBatchDeleteDto): Promise<OperationResultVo> {
    const result = await this.notificationService.adminDelete(deleteDto)
    return OperationResultVo.create(result)
  }
}
