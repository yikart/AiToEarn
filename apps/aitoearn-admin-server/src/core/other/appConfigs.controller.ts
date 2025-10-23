/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 应用配置
 */
import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { AppConfigsService } from './appConfigs.service'
import { AppConfigListFilterDto, DeleteConfigDto, GetAppConfigDto, UpdateConfigDto, UpdateConfigsDto } from './dto/appConfigs.dto'

@ApiTags('应用配置')
@Controller('appConfigs')
export class AppConfigsController {
  constructor(
    private readonly appConfigsService: AppConfigsService,
  ) {}

  @ApiOperation({ summary: '获取应用配置' })
  @Get('info')
  async getAppConfigs(
    @Query() query: GetAppConfigDto,
  ) {
    return await this.appConfigsService.getConfig(
      query.appId,
    )
  }

  @ApiOperation({ summary: '更新应用配置' })
  @Put('update')
  async updateConfig(
    @Body() body: UpdateConfigDto,
  ) {
    return await this.appConfigsService.updateConfig(
      body.appId,
      body.key,
      body.value,
      body.description,
      body.metadata,
    )
  }

  @ApiOperation({ summary: '批量更新应用配置' })
  @Put('batchUpdate')
  async batchUpdateConfigs(
    @Body() body: UpdateConfigsDto,
  ) {
    return await this.appConfigsService.batchUpdateConfigs(
      body.appId,
      body.configs,
    )
  }

  @ApiOperation({ summary: '删除应用配置' })
  @Delete('delete')
  async deleteConfig(
    @Body() body: DeleteConfigDto,
  ) {
    return await this.appConfigsService.deleteConfig(
      body.appId,
      body.key,
    )
  }

  @ApiOperation({ summary: '获取应用配置列表' })
  @Get('list/:pageNo/:pageSize')
  async getConfigList(
    @Param() param: TableDto,
    @Query() query: AppConfigListFilterDto,
  ) {
    return await this.appConfigsService.getConfigList(
      param,
      query,
    )
  }
}
