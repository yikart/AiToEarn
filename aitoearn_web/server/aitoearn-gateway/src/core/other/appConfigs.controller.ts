/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 应用配置
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from 'src/auth/auth.guard'
import { AppConfigsService } from './appConfigs.service'
import { GetAppConfigListDto } from './dto/appConfigs.dto'

@ApiTags('应用配置')
@Controller('appConfigs')
export class AppConfigsController {
  constructor(
    private readonly appConfigsService: AppConfigsService,
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
    const res = await this.appConfigsService.getAppConfigList(param)
    return res
  }
}
