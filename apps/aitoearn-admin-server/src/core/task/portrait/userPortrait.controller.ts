import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { UserPortraitListFilterDto } from './portrait.dto'
import { UserPortraitService } from './userPortrait.service'

@ApiTags('用户画像')
@Controller('userPortrait')
export class UserPortraitController {
  constructor(
    private readonly userPortraitService: UserPortraitService,
  ) {}

  @ApiOperation({ summary: '获取账号画像列表' })
  @Post('list/:pageNo/:pageSize')
  async getList(@Param() params: TableDto, @Body() body: UserPortraitListFilterDto) {
    const result = await this.userPortraitService.getList(params, body)
    return result
  }

  @ApiOperation({ summary: '获取账号画像详情' })
  @Get(':userId')
  async getById(@Param('userId') userId: string): Promise<any> {
    const task = await this.userPortraitService.getById(userId)
    return task
  }
}
