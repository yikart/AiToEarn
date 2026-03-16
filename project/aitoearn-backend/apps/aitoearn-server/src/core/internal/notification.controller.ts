import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { CreateToUserDto } from '../notification/notification.dto'
import { NotificationService } from '../notification/notification.service'

@ApiTags('Internal/Notification')
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
      {
        userId: body.userId,
        userType: UserType.User,
        type: body.type,
        relatedId: body.relatedId,
        data: body.data,
        ...(body.messageKey
          ? { messageKey: body.messageKey, vars: body.vars }
          : { title: body.title, content: body.content }),
      },
    )
    return res
  }
}
