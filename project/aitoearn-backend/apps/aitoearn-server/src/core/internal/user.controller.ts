import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreditsService } from '../credits/credits.service'
import { UserService } from '../user/user.service'
import { UserInfoVO } from '../user/user.vo'
import { GeneratePopularizeCodeDto, GetUserByPopularizeCodeDto, GetUserInfoDto, ListUsersByIdsDto } from './user.dto'

@ApiTags('Internal/User')
@Controller('internal')
@Internal()
export class UserInternalController {
  constructor(
    private readonly userService: UserService,
    private readonly creditsService: CreditsService,
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
   * 生成用户推广码
   */
  @ApiDoc({
    summary: 'Generate User Popularize Code',
    body: GeneratePopularizeCodeDto.schema,
  })
  @Post('user/popularize-code/generate')
  async generatePopularizeCode(@Body() body: GeneratePopularizeCodeDto) {
    return this.userService.generateUsePopularizeCode(body.userId)
  }

  /**
   * 根据推广码获取用户信息
   */
  @ApiDoc({
    summary: 'Get User By Popularize Code',
    body: GetUserByPopularizeCodeDto.schema,
    response: UserInfoVO,
  })
  @Post('user/popularize-code/get-user')
  async getUserByPopularizeCode(@Body() body: GetUserByPopularizeCodeDto) {
    return this.userService.getUserByPopularizeCode(body.inviteCode)
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
