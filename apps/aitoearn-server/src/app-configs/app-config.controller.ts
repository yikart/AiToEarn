/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 应用配置
 */
import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { AppConfigService } from './app-config.service'
import { GetAppConfigListDto } from './dto/app-config.dto'

@ApiTags('应用配置')
@Controller('appConfigs')
export class AppConfigController {
  constructor(
    private readonly appConfigService: AppConfigService,
  ) {}

  @ApiOperation({
    description: '获取配置',
    summary: '获取配置',
  })
  @Public()
  @Get('/:appId')
  async getAppConfigList(
    @Param() param: GetAppConfigListDto,
  ) {
    const res = await this.appConfigService.getConfig(param.appId)
    return res
  }
}
