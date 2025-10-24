import { Injectable, Logger } from '@nestjs/common'
import { AccountService } from '../account/account.service'
import { CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDto } from '../account/dto/account.dto'

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name)
  constructor(
    private readonly accountService: AccountService,
  ) { }

  async createSocialMediaAccount(userId: string, body: CreateAccountDto) {
    return await this.accountService.addAccount({
      ...body,
      userId,
    })
  }

  async getAccountDetail(userId: string, accountId: string) {
    return await this.accountService.getAccountById(
      accountId,
    )
  }

  async updateAccountInfo(userId: string, body: UpdateAccountDto) {
    const res = await this.accountService.updateAccountInfoById(body.id, {
      userId,
      ...body,
    })
    return res
  }

  async updateAccountStatistics(userId: string, body: UpdateAccountStatisticsDto) {
    const {
      id,
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
      workCount,
    } = body
    return this.accountService.updateAccountStatistics(
      id,
      {
        fansCount,
        readCount,
        likeCount,
        collectCount,
        commentCount,
        income,
        workCount,
      },
    )
  }
}
