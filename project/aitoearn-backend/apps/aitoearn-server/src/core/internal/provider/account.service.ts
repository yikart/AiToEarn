import { Injectable, Logger } from '@nestjs/common'
import { CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDataDto } from '../../account/account.dto'
import { AccountService } from '../../account/account.service'

@Injectable()
export class AccountInternalService {
  private readonly logger = new Logger(AccountInternalService.name)
  constructor(
    private readonly accountService: AccountService,
  ) { }

  async getAccountInfo(accountId: string) {
    return await this.accountService.getAccountById(accountId)
  }

  async createSocialMediaAccount(userId: string, body: CreateAccountDto) {
    return await this.accountService.addAccount(userId, {
      ...body,
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

  async updateAccountStatistics(accountId: string, body: UpdateAccountStatisticsDataDto) {
    const {
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
      workCount,
    } = body
    return this.accountService.updateAccountStatistics(
      accountId,
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
