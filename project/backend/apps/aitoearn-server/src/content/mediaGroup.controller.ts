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
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { MediaGroup } from '@yikart/mongodb'
import { fileUtil } from '../common/utils/file.util'
import {
  CreateMediaGroupDto,
  MediaGroupFilterDto,
  UpdateMediaGroupDto,
} from './dto/mediaGroup.dto'
import { MediaService } from './media.service'
import { MediaGroupService } from './mediaGroup.service'

@ApiTags('OpenSource/Me/MediaGroup')
@Controller('media/group')
export class MediaGroupController {
  constructor(
    private readonly mediaGroupService: MediaGroupService,
    private readonly mediaService: MediaService,
  ) { }

  @ApiDoc({
    summary: 'Create Media Group',
    description: 'Create a media group for organizing assets.',
    body: CreateMediaGroupDto.schema,
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

  @ApiDoc({
    summary: 'Delete Media Group',
    description: 'Delete a media group by its identifier.',
  })
  @Delete(':id')
  async delGroup(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const mediaGroup = await this.mediaGroupService.getInfo(id)
    if (!mediaGroup || mediaGroup.userId !== token.id) {
      throw new AppException(ResponseCode.MediaGroupNotFound, 'Media Group not found')
    }
    if (
      mediaGroup.isDefault
    ) {
      throw new AppException(ResponseCode.MediaGroupDefaultNotAllowed, 'Default media group cannot be deleted')
    }
    const res = await this.mediaGroupService.del(id)
    return res
  }

  @ApiDoc({
    summary: 'Update Media Group Information',
    description: 'Update attributes of a media group.',
    body: UpdateMediaGroupDto.schema,
  })
  @Post('info/:id')
  async updateGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMediaGroupDto,
  ) {
    const dataInfo = await this.mediaGroupService.getInfo(id)
    if (!dataInfo || dataInfo.userId !== token.id) {
      throw new AppException(ResponseCode.MediaGroupNotFound)
    }
    const res = await this.mediaGroupService.updateInfo(id, body)
    return res
  }

  @ApiDoc({
    summary: 'Get Media Group by ID',
    description: 'Get a media group by its identifier.',
  })
  @Get('info/:id')
  async getGroupInfo(@Param('id') id: string) {
    const res = await this.mediaGroupService.getInfo(id)
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
      item.url = fileUtil.buildUrl(item.url)
      item.thumbUrl = fileUtil.buildUrl(item.thumbUrl)
    })
    return { ...group, mediaList: res }
  }

  @ApiDoc({
    summary: 'List Media Groups',
    description: 'Retrieve a paginated list of media groups.',
    query: MediaGroupFilterDto.schema,
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
