import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { UpdateUserInfoDto } from './dto/user.dto'
import { UserInfoVO } from './dto/user.vo'
import { UserService } from './user.service'

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiOperation({
    summary: '用户信息',
    description: '用户信息',
  })
  @Public()
  @ApiResponse({ status: 200, type: UserInfoVO })
  @Get('info/mail/:mail')
  async infoByMail(@Param('mail') mail: string) {
    const res = await this.userService.getUserInfoByMail(mail)
    return res
  }

  @ApiOperation({
    description: '获取自己的用户信息',
    summary: '获取自己的用户信息',
  })
  @ApiResponse({ status: 200, type: UserInfoVO })
  @Get('mine')
  getUserInfoById(@GetToken() token: TokenInfo) {
    return this.userService.getUserInfoById(token.id)
  }

  @ApiOperation({ description: '更新用户信息', summary: '更新用户信息' })
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
  @ApiOperation({ summary: '获取我的积分记录' })
  @Get('points/records')
  getMyPointsRecords(
    @GetToken() token: TokenInfo,
    @Query() query: TableDto,
  ) {
    return this.userService.getMyPointsRecords(token.id, query.pageNo, query.pageSize)
  }
}
