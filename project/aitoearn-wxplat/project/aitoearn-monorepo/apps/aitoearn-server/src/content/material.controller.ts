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
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AppException, ResponseCode, TableDto, UserType } from '@yikart/common'
import { MaterialType, MediaType } from '@yikart/mongodb'
import { UserService } from '../user/user.service'
import {
  CreateMaterialDto,
  CreateMaterialTaskDto,
  MaterialFilterDto,
  MaterialIdsDto,
  UpdateMaterialDto,
} from './dto/material.dto'
import { MaterialService } from './material.service'
import { MaterialGroupService } from './materialGroup.service'
import { MaterialTaskService } from './materialTask.service'
import { MediaGroupService } from './mediaGroup.service'

export const MediaMaterialTypeMap = new Map<MediaType, MaterialType>([
  [MediaType.VIDEO, MaterialType.VIDEO],
  [MediaType.IMG, MaterialType.ARTICLE],
])

@ApiTags('草稿')
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
    private readonly userService: UserService,
    private readonly materialTaskService: MaterialTaskService,
    private readonly mediaGroupService: MediaGroupService,
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
    const getInfo = await this.materialGroupService.getGroupInfo(body.groupId)
    if (!getInfo) {
      throw new AppException(1000, '素材组不存在')
    }
    const res = await this.materialService.create({
      ...body,
      userId: token.id,
      userType: UserType.User,
      type: getInfo?.type,
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
    // await this.userService.checkUserVipRights(token.id)
    const mediaGroupInfo = await this.mediaGroupService.getInfo(body.mediaGroups[0])
    if (!mediaGroupInfo) {
      throw new AppException(1000, '素材组不存在')
    }

    const type = mediaGroupInfo?.type
    const res = await this.materialTaskService.createTask({
      ...body,
      type: MediaMaterialTypeMap.get(type)!,
    })
    return res
  }

  @ApiOperation({
    summary: '预览草稿生成任务',
    description: '预览草稿生成任务',
  })
  @Get('task/preview/:id')
  async previewTask(@Param('id') id: string) {
    const res = await this.materialTaskService.previewTask(id)
    return res
  }

  @ApiOperation({
    summary: '开始草稿生成任务',
    description: '开始草稿生成任务',
  })
  @Get('task/start/:id')
  async startTask(@Param('id') id: string) {
    const res = await this.materialTaskService.startTask(id)
    return res
  }

  @ApiOperation({
    summary: '批量删除草稿',
    description: '批量删除草稿',
  })
  @Delete('list')
  async delByIds(
    @GetToken() token: TokenInfo,
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.delByIds(token.id, body.ids)
    return res
  }

  @ApiOperation({
    summary: '删除草稿',
    description: '删除草稿',
  })
  @Delete(':id')
  async del(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const material = await this.materialService.getInfo(id)
    if (!material || material.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialNotFound, 'Material not found')
    }
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
    const material = await this.materialService.getInfo(id)
    if (!material || material.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialNotFound, 'Material not found')
    }
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
