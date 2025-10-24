import { Body, Controller, Post } from '@nestjs/common'
import { AccountPortraitListQueryDto, GetAccountPortraitDto, ReportAccountPortraitDto } from './account-portrait.dto'
import { AccountPortraitService } from './account-portrait.service'

@Controller()
export class AccountPortraitController {
  constructor(private readonly accountPortraitService: AccountPortraitService) {}

  // @NatsMessagePattern('task.account.portrait.report')
  @Post('task/account/portrait/report')
  async reportAccountPortrait(@Body() data: ReportAccountPortraitDto) {
    await this.accountPortraitService.reportAccountPortrait(data)
  }

  // @NatsMessagePattern('task.account.portrait.get')
  @Post('task/account/portrait/get')
  async getAccountPortrait(@Body() data: GetAccountPortraitDto) {
    const portrait = await this.accountPortraitService.getAccountPortrait(data.accountId)
    return portrait
  }

  // @NatsMessagePattern('task.accountPortrait.list')
  @Post('task/accountPortrait/list')
  async listAccountPortraits(@Body() data: AccountPortraitListQueryDto) {
    const result = await this.accountPortraitService.listAccountPortraits(data.page, data.filter)
    return {
      list: result.list,
      total: result.total,
    }
  }
}
