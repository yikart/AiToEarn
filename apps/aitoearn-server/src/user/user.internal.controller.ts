import { Body, Controller, Post } from '@nestjs/common'
import { UserService } from './user.service'

@Controller()
export class UserInternalController {
  constructor(private readonly userService: UserService) { }
  @Post('userInternal/user/info')
  getUserInfoById(@Body() body: { id: string }) {
    return this.userService.getUserInfoById(body.id)
  }
}
