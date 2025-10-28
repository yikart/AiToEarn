import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import {
  CreateToUserDto,
} from './notification.dto'
import { NotificationService } from './notification.service'

@ApiTags('notification - 通知')
@Controller()
@Internal()
export class NotificationInternalController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('notificationInternal.createForUser')
  async createToUser(
    @Body() body: CreateToUserDto,
  ) {
    const res = await this.notificationService.createForUser(
      body,
    )
    return res
  }
}
