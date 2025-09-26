import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { AppException, NatsMessagePattern, ResponseCode } from '@yikart/common'
import { UserWithdrawListDto, WithdrawCreateDto, WithdrawInfoDto } from './withdraw.dto'
import { WithdrawService } from './withdraw.service'

@Controller()
export class WithdrawController {
  constructor(
    private readonly withdrawService: WithdrawService,
  ) {}

  @NatsMessagePattern('payment.withdraw.create')
  async create(@Payload() body: WithdrawCreateDto) {
    if (body.incomeRecordId) {
      const oldData = await this.withdrawService.getInfoByIncomeId(body.incomeRecordId)
      if (oldData)
        throw new AppException(ResponseCode.WithdrawRecordExists)
    }
    return this.withdrawService.create(body)
  }

  @NatsMessagePattern('payment.withdraw.info')
  async info(@Payload() body: WithdrawInfoDto) {
    return this.withdrawService.getInfoById(body.id)
  }

  @NatsMessagePattern('payment.withdraw.list')
  async list(@Payload() body: UserWithdrawListDto) {
    return this.withdrawService.getListOfUser(body.page, body.filter)
  }
}
