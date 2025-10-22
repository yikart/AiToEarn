import { Body, Controller, Post } from '@nestjs/common'
import { AccountPortraitListQueryDto, GetAccountPortraitDto, ReportAccountPortraitDto } from './account-portrait.dto'
import { AccountPortraitService } from './account-portrait.service'

@Controller('accountPortrait')
export class AccountPortraitController {
  constructor(private readonly accountPortraitService: AccountPortraitService) {}

  @Post('accountPortrait/report')
  async reportAccountPortrait(@Body() data: ReportAccountPortraitDto) {
    await this.accountPortraitService.reportAccountPortrait(data)
  }

  @Post('accountPortrait/get')
  async getAccountPortrait(@Body() data: GetAccountPortraitDto) {
    const portrait = await this.accountPortraitService.getAccountPortrait(data.accountId)
    return portrait
  }

  @Post('accountPortrait/list')
  async listAccountPortraits(@Body() data: AccountPortraitListQueryDto) {
    const result = await this.accountPortraitService.listAccountPortraits(data.page, data.filter)
    return {
      list: result.list,
      total: result.total,
    }
  }
}
