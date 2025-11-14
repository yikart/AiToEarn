import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreateToUserDto } from '../notification/notification.dto'
import { NotificationService } from '../notification/notification.service'

@ApiTags('OpenSource/Internal/Notification')
@Controller('internal')
@Internal()
export class NotificationInternalController {
  constructor(private readonly notificationService: NotificationService) { }

  @ApiDoc({
    summary: 'Create Notification for User',
    body: CreateToUserDto.schema,
  })
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
