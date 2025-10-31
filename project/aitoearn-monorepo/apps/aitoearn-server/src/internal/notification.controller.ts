import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { CreateToUserDto } from '../notification/notification.dto'
import { NotificationService } from '../notification/notification.service'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class NotificationInternalController {
  constructor(private readonly notificationService: NotificationService) { }

  @ApiOperation({ summary: '创建到用户的通知' })
  @Post('notification/createForUser')
  async createToUser(
    @Body() body: CreateToUserDto,
  ) {
    const res = await this.notificationService.createForUser(
      body,
    )
    return res
  }
}
