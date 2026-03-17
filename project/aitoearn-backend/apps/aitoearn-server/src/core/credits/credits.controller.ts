import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreditsRecordsDto } from './credits.dto'
import { CreditsService } from './credits.service'
import { CreditsBalanceVo, CreditsRecordsVo } from './credits.vo'

@ApiTags('Me/Credits')
@Controller('user/credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @ApiDoc({
    summary: 'Get My Credits Balance',
    response: CreditsBalanceVo,
  })
  @Get()
  async getMyCreditsBalance(@GetToken() token: TokenInfo) {
    const balance = await this.creditsService.getBalance(token.id)
    return CreditsBalanceVo.create({ balance })
  }

  @ApiDoc({
    summary: 'Get My Credits Records',
    query: CreditsRecordsDto.schema,
    response: CreditsRecordsVo,
  })
  @Get('records')
  async getMyCreditsRecords(
    @GetToken() token: TokenInfo,
    @Query() query: CreditsRecordsDto,
  ) {
    const [list, total] = await this.creditsService.getRecords(token.id, query)
    return new CreditsRecordsVo(list, total, query)
  }
}
