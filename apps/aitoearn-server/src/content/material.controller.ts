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
import { TableDto } from '@yikart/common'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { UserService } from '../user/user.service'
import {
  CreateMaterialDto,
  CreateMaterialTaskDto,
  MaterialFilterDto,
  MaterialIdsDto,
  UpdateMaterialDto,
} from './dto/material.dto'
import { MaterialService } from './material.service'

@ApiTags('草稿')
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly userService: UserService,
  ) { }

  @ApiOperation({
    summary: '创建草稿',
    description: '创建草稿',
  })
  @Post()
  async create(
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
    await this.userService.checkUserVipRights(token.id)
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
  async previewTask(@Param('id') id: string) {
    const res = await this.materialService.previewTask(id)
    return res
  }

  @ApiOperation({
    summary: '开始草稿生成任务',
    description: '开始草稿生成任务',
  })
  @Get('task/start/:id')
  async startTask(@Param('id') id: string) {
    const res = await this.materialService.startTask(id)
    return res
  }

  @ApiOperation({
    summary: '批量删除草稿',
    description: '批量删除草稿',
  })
  @Delete('list')
  async delByIds(@Body() body: MaterialIdsDto) {
    const res = await this.materialService.delByIds(body.ids)
    return res
  }

  @ApiOperation({
    summary: '删除素材',
    description: '删除素材',
  })
  @Delete(':id')
  async del(@Param('id') id: string) {
    const res = await this.materialService.del(id)
    return res
  }

  @ApiOperation({
    summary: '更新草稿信息',
    description: '更新草稿信息',
  })
  @Put('info/:id')
  async upMaterialInfo(
    @Param('id') id: string,
    @Body() body: UpdateMaterialDto,
  ) {
    const res = await this.materialService.updateInfo(id, body)
    return res
  }

  @ApiOperation({
    summary: '获取草稿列表',
    description: '获取草稿列表',
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
}
