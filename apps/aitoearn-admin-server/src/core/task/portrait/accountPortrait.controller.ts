import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { AccountPortraitService } from './accountPortrait.service'
import { AccountPortraitListFilterDto } from './portrait.dto'

@ApiTags('账号画像')
@Controller('accountPortrait')
export class AccountPortraitController {
  constructor(
    private readonly accountPortraitService: AccountPortraitService,
  ) {}

  @ApiOperation({ summary: '获取账号画像列表' })
  @Post('list/:pageNo/:pageSize')
  async getList(@Param() params: TableDto, @Body() body: AccountPortraitListFilterDto) {
    const result = await this.accountPortraitService.getList(params, body)
    return result
  }

  @ApiOperation({ summary: '获取账号画像详情' })
  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    const task = await this.accountPortraitService.getById(id)
    return task
  }
}
