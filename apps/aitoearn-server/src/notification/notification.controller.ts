import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
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

@ApiTags('notification - 通知')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }
  @ApiOperation({ summary: '获取未读通知数量' })
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

  @ApiOperation({ summary: '获取用户通知列表' })
  @Get()
  async getUserNotifications(
    @GetToken() token: TokenInfo,
    @Query() queryDto: QueryNotificationsDto,
  ) {
    const result = await this.notificationService.findByUser(token.id, queryDto)
    return result
  }

  @ApiOperation({ summary: '获取通知详情' })
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

  @ApiOperation({ summary: '标记通知已读' })
  @Put('read')
  async markAsRead(
    @GetToken() token: TokenInfo,
    @Body() markDto: MarkAsReadDto,
  ): Promise<OperationResultVo> {
    const result = await this.notificationService.markAsRead(token.id, markDto)
    return OperationResultVo.create(result)
  }

  @ApiOperation({ summary: '标记全部通知已读' })
  @Put('read-all')
  async markAllAsRead(
    @GetToken() token: TokenInfo,
  ): Promise<OperationResultVo> {
    const result = await this.notificationService.markAllAsRead(token.id)
    return OperationResultVo.create(result)
  }

  @ApiOperation({ summary: '删除通知' })
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
