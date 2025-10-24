import { Body, Controller, Post } from '@nestjs/common'
import { GetUserPortraitDto, ReportUserPortraitDto, UserPortraitListQueryDto } from './user-portrait.dto'
import { UserPortraitService } from './user-portrait.service'
import { UserPortraitListVo } from './user-portrait.vo'

@Controller()
export class UserPortraitController {
  constructor(private readonly userPortraitService: UserPortraitService) {}

  // @NatsMessagePattern('task.userPortrait.report')
  @Post('task/userPortrait/report')
  async reportUserPortrait(@Body() data: ReportUserPortraitDto) {
    await this.userPortraitService.reportUserPortrait(data)
  }

  // @NatsMessagePattern('task.userPortrait.get')
  @Post('task/userPortrait/get')
  async getUserPortrait(@Body() data: GetUserPortraitDto) {
    const portrait = await this.userPortraitService.getUserPortrait(data.userId)
    return portrait
  }

  // @NatsMessagePattern('task.userPortrait.list')
  @Post('task/userPortrait/list')
  async listUserPortraits(@Body() query: UserPortraitListQueryDto) {
    const result = await this.userPortraitService.listUserPortraits(query)
    return UserPortraitListVo.create({
      list: result.list,
      total: result.total,
    })
  }
}
