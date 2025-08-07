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
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { TableDto } from 'src/common/dto/table.dto'
import { MediaGroup, MediaType } from 'src/transports/content/common'
import { MediaNatsApi } from '@/transports/content/media.natsApi'
import { CreateMediaDto, MediaFilterDto } from './dto/media.dto'
import {
  CreateMediaGroupDto,
  MediaGroupFilterDto,
  UpdateMediaGroupDto,
} from './dto/mediaGroup.dto'
import { MediaService } from './media.service'

@ApiTags('媒体资源')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService, private readonly mediaNatsApi: MediaNatsApi,
  ) { }

  @ApiOperation({
    summary: '初始化媒体库',
    description: '初始化媒体库',
  })
  @Post('default')
  async createDefault(
    @GetToken() token: TokenInfo,
  ) {
    const res = await this.mediaNatsApi.createDefault(token.id)
    return res
  }

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
    const res = await this.mediaService.getList(param, {
      userId: token.id,
      ...query,
    })
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
      {
        userId,
        groupId: group._id,
      },
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

    const updatedList = await Promise.all(
      list.map(item => this.getMediaDesList(token.id, item)),
    )
    return { list: updatedList, total }
  }
}
