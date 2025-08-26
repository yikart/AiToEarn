import { NatsMessagePattern } from '@common/decorators'
import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import {
  AddPointsDto,
  DeductPointsDto,
  PointsBalanceDto,
  PointsRecordsDto,
} from './points.dto'
import { PointsService } from './points.service'
import {
  PointsBalanceVo,
  PointsRecordsVo,
} from './points.vo'

@Controller()
export class PointsController {
  private readonly logger = new Logger(PointsController.name)

  constructor(private readonly pointsService: PointsService) {}

  /**
   * 获取用户积分余额
   */
  @NatsMessagePattern('user.points.get')
  async getBalance(@Payload() data: PointsBalanceDto): Promise<PointsBalanceVo> {
    const balance = await this.pointsService.getBalance(data.userId)
    return PointsBalanceVo.create({ balance })
  }

  /**
   * 获取积分记录列表
   */
  @NatsMessagePattern('user.points.getRecords')
  async getRecords(@Payload() data: PointsRecordsDto): Promise<PointsRecordsVo> {
    const { page, pageSize } = data
    const [list, total] = await this.pointsService.getRecords(data.userId, page, pageSize)
    return PointsRecordsVo.create({
      list,
      total,
    })
  }

  /**
   * 增加积分
   */
  @NatsMessagePattern('user.points.add')
  async addPoints(@Payload() data: AddPointsDto) {
    await this.pointsService.addPoints(data)
    return { success: true }
  }

  /**
   * 扣减积分
   */
  @NatsMessagePattern('user.points.deduct')
  async deductPoints(@Payload() data: DeductPointsDto) {
    await this.pointsService.deductPoints(data)
    return { success: true }
  }
}
