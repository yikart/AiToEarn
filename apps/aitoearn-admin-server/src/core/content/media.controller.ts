/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 媒体资源
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
import { TableDto } from 'src/common/dto/table.dto'
import { MediaGroup } from 'src/transports/content/common'
import { UserType } from '@/common'
import { GetToken } from '@/common/auth/auth.guard'
import { TokenInfo } from '@/common/auth/interfaces/auth.interfaces'
import { AddUseCountOfListDto, CreateMediaDto, MediaFilterDto } from './dto/media.dto'
import {
  CreateMediaGroupDto,
  MediaGroupFilterDto,
  UpdateMediaGroupDto,
} from './dto/mediaGroup.dto'
import { MediaService } from './media.service'

@ApiTags('媒体资源')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({
    description: '创建媒体资源',
    summary: '创建媒体资源',
  })
  @Post()
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMediaDto,
  ) {
    const res = await this.mediaService.create({
      userId: token.id,
      userType: UserType.Admin,
      ...body,
    })
    return res
  }

  @ApiOperation({
    description: '删除媒体资源',
    summary: '删除媒体资源',
  })
  @Delete(':id')
  async del(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.mediaService.del(id)
    return res
  }

  @ApiOperation({
    description: '获取媒体列表',
    summary: '获取媒体列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MediaFilterDto,
  ) {
    const res = await this.mediaService.getList(param, token.id, query.groupId)
    return res
  }

  @ApiOperation({
    description: '创建发媒体资源组',
    summary: '创建发媒体资源组',
  })
  @Post('group')
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMediaGroupDto,
  ) {
    const res = await this.mediaService.createGroup(token.id, {
      type: body.type,
      title: body.title,
      desc: body.desc,
    })
    return res
  }

  @ApiOperation({
    description: '删除媒体资源组',
    summary: '删除媒体资源',
  })
  @Delete('group/:id')
  async delGroup(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.mediaService.delGroup(id)
    return res
  }

  @ApiOperation({
    description: '更新资源组信息',
    summary: '更新资源组信息',
  })
  @Post('group/info/:id')
  async updateGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMediaGroupDto,
  ) {
    const res = await this.mediaService.updateGroupInfo(id, body)
    return res
  }

  /**
   * 获取资源组的简略图列表
   * @param userId
   * @param group
   * @returns
   */
  private async getMediaDesList(userId: string, group: MediaGroup) {
    const res = await this.mediaService.getList(
      { pageNo: 1, pageSize: 3 },
      userId,
      group._id,
    )
    return { ...group, mediaList: res }
  }

  @ApiOperation({
    description: '获取媒体组列表',
    summary: '获取媒体组列表',
  })
  @Get('group/list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MediaGroupFilterDto,
  ) {
    const { list, total } = await this.mediaService.getGroupList(param, {
      userId: token.id,
      ...query,
    })

    return { list, total }
  }

  @ApiOperation({
    description: '更新素材的使用次数',
    summary: '更新素材的使用次数',
  })
  @Put('addUseCount/:id')
  async addUseCount(
    @Param('id') id: string,
  ) {
    const res = await this.mediaService.addUseCount(id)
    return res
  }

  @ApiOperation({
    description: '批量更新素材的使用次数',
    summary: '批量更新素材的使用次数',
  })
  @Put('addUseCountOfList')
  async addUseCountOfList(
    @Body() body: AddUseCountOfListDto,
  ) {
    const res = await this.mediaService.addUseCountOfList(body.ids)
    return res
  }
}
