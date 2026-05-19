import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { UserService } from '../user/user.service'
import { UserInfoVO } from '../user/user.vo'
import { GetUserInfoDto, ListUsersByIdsDto } from './user.dto'

@ApiTags('Internal/User')
@Controller('internal')
@Internal()
export class UserInternalController {
  constructor(
    private readonly userService: UserService,
  ) { }

  @ApiDoc({
    summary: 'Get User Information',
    query: GetUserInfoDto.schema,
    response: UserInfoVO,
  })
  @Post('user/info')
  getUserInfoById(@Body() body: GetUserInfoDto) {
    return this.userService.getUserInfoById(body.id)
  }

  /**
   * 批量获取用户信息
   */
  @ApiDoc({
    summary: 'List Users By IDs',
    body: ListUsersByIdsDto.schema,
    response: [UserInfoVO],
  })
  @Post('user/list-by-ids')
  async listUsersByIds(@Body() body: ListUsersByIdsDto) {
    return this.userService.listUsersByIds(body.userIds)
  }
}
