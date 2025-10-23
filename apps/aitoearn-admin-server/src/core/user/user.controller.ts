import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { ClearVipDto, SetVipDto, UserListQueryDto } from './dto/user.dto'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name)

  constructor(private readonly userService: UserService) {}

  @Get('info/:userId')
  getUserInfo(
    @Param() params: { userId: string },
  ) {
    return this.userService.getUserInfo(params.userId)
  }

  @Get('list/:pageNo/:pageSize')
  list(@Param() params: TableDto, @Query() query: UserListQueryDto) {
    return this.userService.list(params, query)
  }

  @Post('vip/doVipAddAllPoints')
  async doVipAddAllPoints() {
    const res = await this.userService.doVipAddAllPoints()
    return res
  }

  // 设置会员
  @Post('vip/set')
  async setVip(@Body() body: SetVipDto) {
    const res = await this.userService.setVip(body)
    return res
  }

  // 清除会员
  @Delete('vip/clear/:userId')
  async clearVip(@Param() param: ClearVipDto) {
    const res = await this.userService.clearVipInfo(param.userId)
    return res
  }

  @Get('getUserToken/:userId')
  getUserToken(
    @Param() params: { userId: string },
  ) {
    return this.userService.getUserToken(params.userId)
  }

  @Post('portrait/:userId')
  async upPortrait(@Param('userId') userId: string) {
    const result = await this.userService.upPortrait(userId)
    return result
  }
}
