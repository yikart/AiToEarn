import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { SetAiConfigDto, SetAiConfigItemDto, UpdateUserInfoDto } from './dto/user.dto'
import { UserInfoVO } from './dto/user.vo'
import { UserService } from './user.service'

@ApiTags('OpenSource/User/User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiDoc({
    summary: 'Get User Information by Email',
    description: 'Retrieve user information by specifying the email address.',
    response: UserInfoVO,
  })
  @Public()
  @Get('info/mail/:mail')
  async infoByMail(@Param('mail') mail: string) {
    const res = await this.userService.getUserInfoByMail(mail)
    return res
  }

  @ApiDoc({
    summary: 'Get Current User Information',
    description: 'Retrieve the profile of the authenticated user.',
    response: UserInfoVO,
  })
  @Get('mine')
  getUserInfoById(@GetToken() token: TokenInfo) {
    return this.userService.getUserInfoById(token.id)
  }

  @ApiDoc({
    summary: 'Update User Information',
    description: 'Update the profile of the authenticated user.',
    body: UpdateUserInfoDto.schema,
  })
  @Put('info/update')
  async updateInfo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateUserInfoDto,
  ) {
    const userInfo = await this.userService.getUserInfoById(token.id)
    if (!userInfo)
      throw new AppException(ResponseCode.UserNotFound, 'User not found')

    const res = await this.userService.updateUserInfo(token.id, body)
    return res
  }

  // 积分相关
  @ApiDoc({
    summary: 'Get My Points Records',
    query: TableDto.schema,
  })
  @Get('points/records')
  getMyPointsRecords(
    @GetToken() token: TokenInfo,
    @Query() query: TableDto,
  ) {
    return this.userService.getMyPointsRecords(token.id, query.pageNo, query.pageSize)
  }

  @ApiDoc({
    summary: 'Set AI Configuration',
    body: SetAiConfigDto.schema,
  })
  @Put('ai/config/info')
  async setAiConfig(
    @GetToken() token: TokenInfo,
    @Body() body: SetAiConfigDto,
  ) {
    return this.userService.setAiConfig(token.id, body)
  }

  @ApiDoc({
    summary: 'Set AI Configuration Item',
    body: SetAiConfigItemDto.schema,
  })
  @Put('ai/config/item')
  async setAiConfigItem(
    @GetToken() token: TokenInfo,
    @Body() body: SetAiConfigItemDto,
  ) {
    return this.userService.setAiConfigItem(token.id, body.type, body.value)
  }
}
