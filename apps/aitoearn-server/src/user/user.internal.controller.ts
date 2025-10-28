import { Body, Controller, Post } from '@nestjs/common'
import { Internal } from '@yikart/aitoearn-auth'
import { UserService } from './user.service'

@Controller()
@Internal()
export class UserInternalController {
  constructor(private readonly userService: UserService) { }
  @Post('userInternal/user/info')
  getUserInfoById(@Body() body: { id: string }) {
    return this.userService.getUserInfoById(body.id)
  }
}
