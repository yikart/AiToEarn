/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 草稿
 */
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
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto, UserType } from '@yikart/common'
import { GetToken } from '../../common/auth/auth.guard'
import { TokenInfo } from '../../common/auth/interfaces/auth.interfaces'
import {
  AdminMaterialListByIdsFilterDto,
  CreateMaterialDto,
  CreateMaterialTaskDto,
  MaterialFilterDto,
  UpdateMaterialDto,
} from './dto/material.dto'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, UpdateMaterialGroupDto } from './dto/materialGroup.dto'
import { MaterialService } from './material.service'
import { ContentUtilService } from './util.service'

@ApiTags('草稿')
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly contentUtilService: ContentUtilService,
  ) { }

  @ApiOperation({
    summary: '创建草稿',
    description: '创建草稿',
  })
  @Post()
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialDto,
  ) {
    const res = await this.materialService.create({
      ...body,
    })
    return res
  }

  @ApiOperation({
    summary: '创建批量生成草稿任务',
    description: '创建批量生成草稿任务',
  })
  @Post('task/create')
  async createTask(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialTaskDto,
  ) {
    const res = await this.materialService.createTask({
      ...body,
    })
    return res
  }

  @ApiOperation({
    summary: '预览草稿生成任务',
    description: '预览草稿生成任务',
  })
  @Get('task/preview/:id')
  async previewTask(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.materialService.previewTask(id)
    return res
  }

  @ApiOperation({
    summary: '开始草稿生成任务',
    description: '开始草稿生成任务',
  })
  @Get('task/start/:id')
  async startTask(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.materialService.startTask(id)
    return res
  }

  @ApiOperation({
    summary: '删除素材',
    description: '删除素材',
  })
  @Delete('byMinUseCount')
  async delByMinUseCount(@GetToken() token: TokenInfo, @Body() body: {
    groupId: string
    minUseCount: number
  }) {
    const res = await this.materialService.delByMinUseCount(body.groupId, body.minUseCount)
    return res
  }

  @ApiOperation({
    summary: '删除素材',
    description: '删除素材',
  })
  @Delete(':id')
  async del(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.materialService.del(id)
    return res
  }

  @ApiOperation({
    summary: '更新草稿信息',
    description: '更新草稿信息',
  })
  @Put('info/:id')
  async upMaterialInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMaterialDto,
  ) {
    const res = await this.materialService.updateInfo(id, body)
    return res
  }

  @ApiOperation({
    summary: '获取素材列表',
    description: '获取素材列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialFilterDto,
  ) {
    const res = await this.materialService.getList(
      param,
      query,
    )
    return res
  }

  @ApiOperation({
    description: '创建素材组',
    summary: '创建素材组',
  })
  @Post('group')
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialGroupDto,
  ) {
    const res = await this.materialService.createGroup({
      ...body,
      userId: token.id,
      userType: UserType.Admin,
    })
    return res
  }

  @ApiOperation({
    description: '删除素材组',
    summary: '删除素材组',
  })
  @Delete('group/:id')
  async delGroup(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.materialService.delGroup(id)
    return res
  }

  @ApiOperation({
    description: '更新素材组信息',
    summary: '更新素材组信息',
  })
  @Post('group/info/:id')
  async updateGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMaterialGroupDto,
  ) {
    const res = await this.materialService.updateGroupInfo(id, body)
    return res
  }

  @ApiOperation({
    description: '获取素材组信息',
    summary: '获取素材组信息',
  })
  @Get('group/info/:id')
  async getGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const res = await this.materialService.getGroupInfo(id)
    return res
  }

  @ApiOperation({
    description: '获取素材组列表',
    summary: '获取素材组列表',
  })
  @Get('group/list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialGroupFilterDto,
  ) {
    const res = await this.materialService.getGroupList(param, {
      userId: token.id,
      userType: UserType.Admin,
      ...query,
    })
    return res
  }

  @ApiOperation({
    description: '获取媒体列表',
    summary: '获取媒体列表',
  })
  @Get('listByIds/:pageNo/:pageSize')
  async listByIds(
    @Param() param: TableDto,
    @Query() query: AdminMaterialListByIdsFilterDto,
  ) {
    const res = await this.materialService.listByIds(param, query)
    return res
  }

  @ApiOperation({
    description: '获取youtobe频道列表',
    summary: '获取youtobe频道列表失败',
  })
  @Get('util/toutube/videoCategories/:regionCode')
  async utilGetYouTuBeVideoCategories(
    @Param('id') regionCode: string,
  ) {
    const res = await this.contentUtilService.getYouTuBeVideoCategories(regionCode)
    return res
  }

  @ApiOperation({
    description: '获取B站分区列表',
    summary: '获取B站分区列表',
  })
  @Get('util/bilibili/ArchiveTypeList')
  async utilGetBilibiliArchiveTypeList(
  ) {
    const res = await this.contentUtilService.getBilibiliArchiveTypeList()
    return res
  }
}
