import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import {
  ReportLocationDto,
  ReportLocationDtoSchema,
  SetAiConfigDto,
  SetAiConfigItemDto,
  SwitchUserTypeDto,
  SwitchUserTypeDtoSchema,
  UpdateLocaleDto,
  UpdateLocaleDtoSchema,
  UpdateUserInfoDto,
} from './user.dto'
import { UserService } from './user.service'
import { UserInfoVO } from './user.vo'

@ApiTags('User/User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) { }

  @ApiDoc({
    summary: 'Get User Information by Email',
    description: 'Retrieve user information by specifying the email address.',
    response: UserInfoVO,
  })
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

  @ApiDoc({
    summary: '上报地理位置',
    description: '上报当前用户的地理位置信息',
    body: ReportLocationDtoSchema,
  })
  @Put('/location')
  async reportLocation(
    @GetToken() token: TokenInfo,
    @Body() body: ReportLocationDto,
  ) {
    await this.userService.updateLocation(token.id, body)
  }

  @ApiDoc({
    summary: '设置语言偏好',
    description: '设置当前用户的语言偏好（en-US 或 zh-CN）',
    body: UpdateLocaleDtoSchema,
  })
  @Patch('/locale')
  async updateLocale(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateLocaleDto,
  ) {
    await this.userService.updateLocale(token.id, body.locale)
  }

  @ApiDoc({
    summary: '切换用户身份',
    description: '在创作者和商家身份之间切换',
    body: SwitchUserTypeDtoSchema,
  })
  @Put('type/switch')
  async switchUserType(
    @GetToken() token: TokenInfo,
    @Body() body: SwitchUserTypeDto,
  ) {
    const userInfo = await this.userService.getUserInfoById(token.id)
    if (!userInfo) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    if (userInfo.userType === body.userType) {
      return { userType: body.userType }
    }

    const success = await this.userService.switchUserType(token.id, body.userType)
    if (!success) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    return { userType: body.userType }
  }
}
