import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common'
import { SkKeyAuthGuard } from '../../common/guards/skKeyAuth.guard'
import { BilibiliService } from '../plat/bilibili/bilibili.service'

@Controller()
export class BilibiliController {
  constructor(private readonly bilibiliService: BilibiliService) {}

  @HttpCode(200)
  @UseGuards(SkKeyAuthGuard)
  @Get('archiveTypeList/:accountId')
  async publishRecordList(@Param('accountId') accountId: string) {
    const res = await this.bilibiliService.archiveTypeList(accountId)

    return res
  }
}
