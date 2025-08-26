import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { ErrHttpBack } from 'src/common/filters/httpException.code'
import { AppException } from '@/common/exceptions'
import { UserVipCycleType } from '@/transports/user/comment'
import { GetPointsRecordsDto } from './dto/points.dto'
import { UpdateUserInfoDto } from './dto/user.dto'
import { UserResDto } from './dto/userRes.dto'
import { UserService } from './user.service'
import { PointsRecordsVo } from './user.vo'

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiOperation({
    summary: '用户信息',
    description: '用户信息',
  })
  @Public()
  @Get('info/mail/:mail')
  infoByMail(@Param('mail') mail: string) {
    return this.userService.getUserInfoByMail(mail)
  }

  @ApiOperation({
    description: '获取自己的用户信息',
    summary: '获取自己的用户信息',
  })
  @ApiResponse({ status: 200, type: UserResDto })
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
      throw new AppException(ErrHttpBack.err_user_no_had)

    const res = await this.userService.updateUserInfo(token.id, body)
    return res
  }

  @ApiOperation({
    description: '设置用户体验VIP信息',
    summary: '设置用户体验VIP信息',
  })
  @Put('vip/set/experience')
  async setVipExperience(
    @GetToken() token: TokenInfo,
  ) {
    const userInfo = await this.userService.getUserInfoById(token.id)
    if (!userInfo)
      throw new AppException(ErrHttpBack.err_user_no_had)
    if (userInfo.vipInfo)
      throw new AppException(ErrHttpBack.err_user_vip_had)

    const res = await this.userService.setUserVipInfo(token.id, UserVipCycleType.EXPERIENCE)
    return res
  }

  // 积分相关
  @ApiOperation({ summary: '获取我的积分记录' })
  @Get('points/records')
  getMyPointsRecords(
    @GetToken() token: TokenInfo,
    @Query() query: GetPointsRecordsDto,
  ): Promise<PointsRecordsVo> {
    const { page = 1, pageSize = 10 } = query
    return this.userService.getMyPointsRecords(token.id, page, pageSize)
  }
}
