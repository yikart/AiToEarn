import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  AdminDeleteNotificationsDto,
  AdminQueryNotificationsDto,
  CreateNotificationDto,
} from './notification.dto'
import { NotificationService } from './notification.service'

@ApiTags('通知管理')
@Controller('task/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: '创建通知' })
  @Post()
  async create(@Body() createDto: CreateNotificationDto): Promise<void> {
    await this.notificationService.create(createDto)
  }

  @ApiOperation({ summary: '获取通知列表' })
  @Get()
  async list(@Query() queryDto: AdminQueryNotificationsDto) {
    const result = await this.notificationService.list(queryDto)
    return result
  }

  @ApiOperation({ summary: '删除通知' })
  @Post('delete')
  async delete(@Body() deleteDto: AdminDeleteNotificationsDto): Promise<any> {
    const result = await this.notificationService.delete(deleteDto)
    return result
  }
}
