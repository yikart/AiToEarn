import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, VipStatus } from '@yikart/common'
import { AddPointsDto, DeductPointsDto } from '../user/dto/points.dto'
import { PointsService } from '../user/points.service'
import { UserService } from '../user/user.service'
import { VipService } from '../user/vip.service'

@ApiTags('OpenSource/Internal/User')
@Controller('internal')
@Internal()
export class UserInternalController {
  constructor(
    private readonly userService: UserService,
    private readonly vipService: VipService,
    private readonly pointsService: PointsService,
  ) { }

  @ApiDoc({
    summary: 'Get User Information',
  })
  @Post('user/info')
  getUserInfoById(@Body() body: { id: string }) {
    return this.userService.getUserInfoById(body.id)
  }

  @ApiDoc({
    summary: 'Get User VIP Information',
  })
  @Post('user/vip/get')
  async getVip(@Body() body: { userId: string }) {
    const user = await this.userService.getUserInfoById(body.userId)
    if (!user) {
      return null
    }
    return this.vipService.getVipInfo(user)
  }

  @ApiDoc({
    summary: 'Set User VIP Status',
  })
  @Post('user/vip/set')
  async setVip(@Body() body: { userId: string, status: VipStatus }) {
    const res = await this.vipService.setVipInfo(body.userId, body.status)
    return res
  }

  @ApiDoc({
    summary: 'Add User Points',
    body: AddPointsDto.schema,
  })
  @Post('user/points/add')
  async addPoints(@Body() body: AddPointsDto) {
    return this.pointsService.addPoints(body)
  }

  @ApiDoc({
    summary: 'Deduct User Points',
    body: DeductPointsDto.schema,
  })
  @Post('user/points/deduct')
  async deductPoints(@Body() body: DeductPointsDto) {
    return this.pointsService.deductPoints(body)
  }
}
