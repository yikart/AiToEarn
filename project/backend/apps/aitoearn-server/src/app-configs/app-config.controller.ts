/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 应用配置
 */
import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AppConfigService } from './app-config.service'
import { GetAppConfigListDto } from './dto/app-config.dto'

@ApiTags('OpenSource/Other/AppConfig')
@Controller('appConfigs')
export class AppConfigController {
  constructor(
    private readonly appConfigService: AppConfigService,
  ) {}

  @ApiDoc({
    summary: 'Get Application Configuration',
    description: 'Retrieve configuration values by application ID.',
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
