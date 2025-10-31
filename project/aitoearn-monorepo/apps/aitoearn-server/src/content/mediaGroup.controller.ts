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
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { MediaGroup } from '@yikart/mongodb'
import { fileUtile } from '../util/file.util'
import {
  CreateMediaGroupDto,
  MediaGroupFilterDto,
  UpdateMediaGroupDto,
} from './dto/mediaGroup.dto'
import { MediaService } from './media.service'
import { MediaGroupService } from './mediaGroup.service'

@ApiTags('媒体资源组')
@Controller('media/group')
export class MediaGroupController {
  constructor(
    private readonly mediaGroupService: MediaGroupService,
    private readonly mediaService: MediaService,
  ) { }

  @ApiOperation({
    description: '创建发媒体资源组',
    summary: '创建发媒体资源组',
  })
  @Post()
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMediaGroupDto,
  ) {
    const res = await this.mediaGroupService.create(token.id, {
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
  @Delete(':id')
  async delGroup(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const mediaGroup = await this.mediaGroupService.getInfo(id)
    if (!mediaGroup || mediaGroup.userId !== token.id) {
      throw new AppException(ResponseCode.MediaGroupNotFound, 'Media Group not found')
    }
    const res = await this.mediaGroupService.del(id)
    return res
  }

  @ApiOperation({
    description: '更新资源组信息',
    summary: '更新资源组信息',
  })
  @Post('info/:id')
  async updateGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMediaGroupDto,
  ) {
    const dataInfo = await this.mediaGroupService.getInfo(id)
    if (!dataInfo || dataInfo.userId !== token.id) {
      throw new AppException(10009, 'No permission to operate this resource group')
    }
    const res = await this.mediaGroupService.updateInfo(id, body)
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
        groupId: (group as any)._id,
      },
    )
    res.list.forEach((item) => {
      item.url = fileUtile.buildUrl(item.url)
      item.thumbUrl = fileUtile.buildUrl(item.thumbUrl)
    })
    return { ...group, mediaList: res }
  }

  @ApiOperation({
    description: '获取媒体组列表',
    summary: '获取媒体组列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MediaGroupFilterDto,
  ) {
    const { list, total } = await this.mediaGroupService.getList(param, {
      userId: token.id,
      ...query,
    })

    const updatedList = await Promise.all(
      list.map(item => this.getMediaDesList(token.id, item)),
    )

    return { list: updatedList, total }
  }
}
