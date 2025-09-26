import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { AdminWithdrawListDto, WithdrawReleaseDto } from '../withdraw.dto'
import { WithdrawAdminService } from './withdrawAdmin.service'

@Controller()
export class WithdrawAdminController {
  constructor(
    private readonly withdrawAdminService: WithdrawAdminService,
  ) {}

  @NatsMessagePattern('payment.admin.withdraw.info')
  async info(@Payload() data: { id: string }) {
    return this.withdrawAdminService.getInfo(data.id)
  }

  @NatsMessagePattern('payment.admin.withdraw.list')
  async list(@Payload() data: AdminWithdrawListDto) {
    return this.withdrawAdminService.getList(data.page, data.filter)
  }

  @NatsMessagePattern('payment.admin.withdraw.release')
  async release(@Payload() data: WithdrawReleaseDto) {
    return this.withdrawAdminService.release(data.id, data)
  }
}
