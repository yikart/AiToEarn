import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import {
  CreateMultiloginAccountDto,
  CreateMultiloginAccountSchema,
  ListBrowserProfilesDto,
  ListBrowserProfilesSchema,
  ListCloudSpacesDto,
  ListCloudSpacesSchema,
  ListMultiloginAccountsDto,
  ListMultiloginAccountsSchema,
  UpdateMultiloginAccountDto,
  UpdateMultiloginAccountSchema,
} from './cloud-spaces.dto'
import { CloudSpacesService } from './cloud-spaces.service'
import {
  BrowserProfileListVo,
  CloudSpaceListVo,
  CloudSpaceVo,
  MultiloginAccountVo,
} from './cloud-spaces.vo'

@ApiTags('云空间管理')
@Controller('cloud-spaces')
export class CloudSpacesController {
  constructor(private readonly cloudSpacesService: CloudSpacesService) {}
  @Get()
  @ApiDoc({
    summary: '获取云空间列表',
    description: '获取云空间列表，支持分页查询，可按关键词、状态、区域进行筛选',
    query: ListCloudSpacesSchema,
    response: CloudSpaceListVo,
  })
  async listCloudSpaces(@Query() dto: ListCloudSpacesDto): Promise<CloudSpaceListVo> {
    const result = await this.cloudSpacesService.listCloudSpaces(dto)
    return CloudSpaceListVo.create(result)
  }

  @Get(':cloudSpaceId/status')
  @ApiDoc({
    summary: '获取云空间状态',
    description: '根据云空间ID获取云空间的当前状态信息，包括运行状态、资源使用情况等',
    response: CloudSpaceVo,
  })
  async getCloudSpaceStatus(@Param('cloudSpaceId') cloudSpaceId: string): Promise<CloudSpaceVo> {
    const result = await this.cloudSpacesService.getCloudSpaceStatus({ cloudSpaceId })
    return CloudSpaceVo.create(result)
  }

  @Delete(':cloudSpaceId')
  @ApiDoc({
    summary: '删除云空间',
    description: '根据云空间ID删除指定的云空间，此操作不可逆，请谨慎操作',
  })
  async deleteCloudSpace(@Param('cloudSpaceId') cloudSpaceId: string) {
    return await this.cloudSpacesService.deleteCloudSpace({ cloudSpaceId })
  }

  @Post(':cloudSpaceId/retry')
  @ApiDoc({
    summary: '重试云空间',
    description: '根据云空间ID重试指定的云空间',
  })
  async retryCloudSpace(@Param('cloudSpaceId') cloudSpaceId: string) {
    return await this.cloudSpacesService.retryCloudSpace({ cloudSpaceId })
  }

  @Get('profiles')
  @ApiDoc({
    summary: '获取浏览器配置文件列表',
    description: '获取浏览器配置文件列表，支持分页查询，可按云空间ID、关键词进行筛选',
    query: ListBrowserProfilesSchema,
    response: BrowserProfileListVo,
  })
  async listProfiles(@Query() dto: ListBrowserProfilesDto) {
    const result = await this.cloudSpacesService.listProfiles(dto)
    return result
  }

  @Post('multilogin-accounts')
  @ApiDoc({
    summary: '创建Multilogin账号',
    description: '创建新的Multilogin账号，用于管理浏览器环境和配置文件',
    body: CreateMultiloginAccountSchema,
  })
  async createMultiloginAccount(@Body() dto: CreateMultiloginAccountDto) {
    const result = await this.cloudSpacesService.createMultiloginAccount(dto)
    return result
  }

  @Get('multilogin-accounts')
  @ApiDoc({
    summary: '获取Multilogin账号列表',
    description: '获取Multilogin账号列表，支持分页查询，可按关键词、激活状态进行筛选',
    query: ListMultiloginAccountsSchema,
    response: [MultiloginAccountVo],
  })
  async listMultiloginAccounts(@Query() dto: ListMultiloginAccountsDto) {
    const result = await this.cloudSpacesService.listMultiloginAccounts(dto)
    return result
  }

  @Get('multilogin-accounts/:id')
  @ApiDoc({
    summary: '根据ID获取Multilogin账号',
    description: '根据账号ID获取指定的Multilogin账号详情，包括账号信息、环境绑定状态等',
    response: MultiloginAccountVo,
  })
  async getMultiloginAccountById(@Param('id') id: string): Promise<MultiloginAccountVo> {
    const result = await this.cloudSpacesService.getMultiloginAccountById(id)
    return MultiloginAccountVo.create(result)
  }

  @Put('multilogin-accounts/:id')
  @ApiDoc({
    summary: '更新Multilogin账号',
    description: '根据账号ID更新指定的Multilogin账号信息，支持更新用户名、密码、邮箱、备注等',
    body: UpdateMultiloginAccountSchema,
  })
  async updateMultiloginAccount(
    @Param('id') id: string,
    @Body() body: UpdateMultiloginAccountDto,
  ): Promise<MultiloginAccountVo> {
    const result = await this.cloudSpacesService.updateMultiloginAccount(id, body)
    return MultiloginAccountVo.create(result)
  }

  @Delete('multilogin-accounts/:id')
  @ApiDoc({
    summary: '删除Multilogin账号',
    description: '根据账号ID删除指定的Multilogin账号，此操作将解绑所有关联的环境配置',
  })
  async removeMultiloginAccount(@Param('id') id: string): Promise<void> {
    return await this.cloudSpacesService.removeMultiloginAccount(id)
  }
}
