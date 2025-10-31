import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { VipStatus } from '@yikart/mongodb'
import { AddPointsDto, DeductPointsDto } from '../user/dto/points.dto'
import { PointsService } from '../user/points.service'
import { UserService } from '../user/user.service'
import { VipService } from '../user/vip.service'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class UserInternalController {
  constructor(
    private readonly userService: UserService,
    private readonly vipService: VipService,
    private readonly pointsService: PointsService,
  ) { }

  @ApiOperation({ summary: '获取用户信息（by id）' })
  @Post('user/info')
  getUserInfoById(@Body() body: { id: string }) {
    return this.userService.getUserInfoById(body.id)
  }

  @ApiOperation({ summary: '设置用户VIP状态' })
  @Post('user/vip/set')
  async setVip(@Body() body: { userId: string, status: VipStatus }) {
    const res = await this.vipService.setVipInfo(body.userId, body.status)
    return res
  }

  @ApiOperation({ summary: '增加用户积分' })
  @Post('user/points/add')
  async addPoints(@Body() body: AddPointsDto) {
    return this.pointsService.addPoints(body)
  }

  @ApiOperation({ summary: '扣减用户积分' })
  @Post('user/points/deduct')
  async deductPoints(@Body() body: DeductPointsDto) {
    return this.pointsService.deductPoints(body)
  }
}
