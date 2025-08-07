/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 素材
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
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { TableDto } from 'src/common/dto/table.dto'
import { MaterialNatsApi } from '@/transports/content/material.natsApi'
import {
  CreateMaterialDto,
  CreateMaterialTaskDto,
  MaterialFilterDto,
  UpdateMaterialDto,
} from './dto/material.dto'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, UpdateMaterialGroupDto } from './dto/materialGroup.dto'
import { MaterialService } from './material.service'

@ApiTags('草稿')
@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService, private readonly materialNatsApi: MaterialNatsApi,
  ) {}

  @ApiOperation({
    summary: '初始化草稿',
    description: '初始化草稿',
  })
  @Post('default')
  async createDefault(
    @GetToken() token: TokenInfo,
  ) {
    const res = await this.materialNatsApi.createDefault(token.id)
    return res
  }

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
  @Delete(':id')
  async del(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.materialService.del(id)
    return res
  }

  @ApiOperation({
    summary: '更新草稿信息',
    description: '更新草稿信息',
  })
  @ApiExtraModels(UpdateMaterialDto)
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
      token.id,
      query.groupId,
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
    description: '获取素材组列表',
    summary: '获取素材组列表',
  })
  @Get('group/list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialGroupFilterDto,
  ) {
    const { list, total } = await this.materialService.getGroupList(param, {
      userId: token.id,
      ...query,
    })

    return { list, total }
  }
}
