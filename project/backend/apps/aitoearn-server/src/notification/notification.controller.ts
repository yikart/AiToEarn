import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import {
  BatchDeleteDto,
  GetUnreadCountDto,
  MarkAsReadDto,
  QueryNotificationsDto,
} from './notification.dto'
import { NotificationService } from './notification.service'
import {
  OperationResultVo,
  UnreadCountVo,
} from './notification.vo'

@ApiTags('OpenSource/Other/Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }
  @ApiDoc({
    summary: 'Get Unread Notification Count',
    query: GetUnreadCountDto.schema,
    response: UnreadCountVo,
  })
  @Get('unread-count')
  async getUnreadCount(
    @GetToken() token: TokenInfo,
    @Query() countDto: GetUnreadCountDto,
  ): Promise<UnreadCountVo> {
    const result = await this.notificationService.getUnreadCount(
      token.id,
      {
        type: countDto.type,
      },
    )
    return UnreadCountVo.create(result)
  }

  @ApiDoc({
    summary: 'List User Notifications',
    query: QueryNotificationsDto.schema,
  })
  @Get()
  async getUserNotifications(
    @GetToken() token: TokenInfo,
    @Query() queryDto: QueryNotificationsDto,
  ) {
    const result = await this.notificationService.findByUser(token.id, queryDto)
    return result
  }

  @ApiDoc({
    summary: 'Get Notification Detail',
  })
  @Get(':id')
  async getNotificationDetail(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const result = await this.notificationService.findById(
      id,
      token.id,
    )
    return result
  }

  @ApiDoc({
    summary: 'Mark Notifications as Read',
    body: MarkAsReadDto.schema,
    response: OperationResultVo,
  })
  @Put('read')
  async markAsRead(
    @GetToken() token: TokenInfo,
    @Body() markDto: MarkAsReadDto,
  ): Promise<OperationResultVo> {
    const result = await this.notificationService.markAsRead(token.id, markDto)
    return OperationResultVo.create(result)
  }

  @ApiDoc({
    summary: 'Mark All Notifications as Read',
    response: OperationResultVo,
  })
  @Put('read-all')
  async markAllAsRead(
    @GetToken() token: TokenInfo,
  ): Promise<OperationResultVo> {
    const result = await this.notificationService.markAllAsRead(token.id)
    return OperationResultVo.create(result)
  }

  @ApiDoc({
    summary: 'Delete Notifications',
    body: BatchDeleteDto.schema,
    response: OperationResultVo,
  })
  @Delete()
  async deleteNotifications(
    @GetToken() token: TokenInfo,
    @Body() deleteDto: BatchDeleteDto,
  ): Promise<OperationResultVo> {
    const result = await this.notificationService.delete(
      token.id,
      {
        notificationIds: deleteDto.notificationIds,
      },
    )
    return OperationResultVo.create(result)
  }
}
