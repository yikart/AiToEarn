import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { CheckVersionDto, QueryAppReleaseDto } from './app-release.dto'
import { AppReleaseService } from './app-release.service'
import { CheckVersionVo } from './app-release.vo'

@ApiTags('App Release')
@Controller('app-release')
export class AppReleaseController {
  constructor(private readonly appReleaseService: AppReleaseService) {}

  @ApiOperation({ summary: '检查版本更新' })
  @Post('check')
  @Public()
  async checkVersion(@Body() data: CheckVersionDto): Promise<CheckVersionVo> {
    const result = await this.appReleaseService.checkVersion(data)
    return CheckVersionVo.create(result)
  }

  @ApiOperation({ summary: '获取最新版本' })
  @Get('latest')
  @Public()
  async getLatest(@Query() query: QueryAppReleaseDto) {
    const result = await this.appReleaseService.getLatestAppRelease(query)
    if (result == null)
      return null
    return result
  }
}
