import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateAppReleaseDto, QueryAppReleaseDto, UpdateAppReleaseDto } from './app-release.dto'
import { AppReleaseService } from './app-release.service'
import { AppReleaseVo } from './app-release.vo'

@ApiTags('App Release')
@Controller('app-release')
export class AppReleaseController {
  constructor(private readonly appReleaseService: AppReleaseService) {}

  @ApiOperation({ summary: '创建版本发布' })
  @Post()
  async create(@Body() data: CreateAppReleaseDto) {
    return this.appReleaseService.createAppRelease(data)
  }

  @ApiOperation({ summary: '更新版本发布' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateAppReleaseDto) {
    return this.appReleaseService.updateAppRelease(id, data)
  }

  @ApiOperation({ summary: '删除版本发布' })
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.appReleaseService.deleteAppRelease({ id })
  }

  @ApiOperation({ summary: '获取版本发布详情' })
  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<AppReleaseVo> {
    const result = await this.appReleaseService.getAppReleaseDetail({ id })
    return AppReleaseVo.create(result as any)
  }

  @ApiOperation({ summary: '查询版本发布列表' })
  @Get()
  async getList(@Query() query: QueryAppReleaseDto) {
    const result = await this.appReleaseService.getAppReleaseList(query)
    return result
  }
}
