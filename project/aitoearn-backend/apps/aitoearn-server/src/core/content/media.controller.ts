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
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, FileUtil, ResponseCode, TableDto } from '@yikart/common'
import { Media } from '@yikart/mongodb'
import { AddUseCountOfListDto, CreateMediaDto, MediaFilterDto, MediaFilterSchema, MediaIdsDto } from './media.dto'
import { MediaService } from './media.service'

@ApiTags('Me/Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  private processMediaFiles(mediaList: Media[]) {
    mediaList.forEach((media) => {
      media.url = FileUtil.buildUrl(media.url)
      if (media.thumbUrl) {
        media.thumbUrl = FileUtil.buildUrl(media.thumbUrl)
      }
    })
  }

  @ApiDoc({
    summary: '创建媒体资源',
    description: '创建媒体资源，包含元数据和文件URL。',
    body: CreateMediaDto.schema,
  })
  @Post()
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMediaDto,
  ) {
    const res = await this.mediaService.create(token.id, body)
    this.processMediaFiles([res])
    return res
  }

  @ApiDoc({
    summary: '批量删除媒体资源',
    description: '根据ID列表批量删除媒体资源。',
    body: MediaIdsDto.schema,
  })
  @Delete('ids')
  async delByIds(@GetToken() token: TokenInfo, @Body() body: MediaIdsDto) {
    const res = await this.mediaService.delByIds(token.id, body.ids)
    return res
  }

  @ApiDoc({
    summary: '按条件删除媒体资源',
    description: '删除符合筛选条件的媒体资源。',
    body: MediaFilterDto.schema,
  })
  @Delete('filter')
  async delByFilter(@GetToken() token: TokenInfo, @Body() body: MediaFilterDto) {
    const res = await this.mediaService.delByFilter(token.id, body)
    return res
  }

  @ApiDoc({
    summary: '删除媒体资源',
    description: '根据ID删除媒体资源。',
  })
  @Delete(':id')
  async del(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const media = await this.mediaService.getInfo(id)
    if (!media || media.userId !== token.id) {
      throw new AppException(ResponseCode.MediaNotFound, 'Media Group not found')
    }
    const res = await this.mediaService.del(id)
    return res
  }

  @ApiDoc({
    summary: '获取媒体资源详情',
    description: '根据ID获取媒体资源详情。',
  })
  @Get('info/:id')
  async getInfo(@Param('id') id: string) {
    const res = await this.mediaService.getInfo(id)
    return res
  }

  @Get('list/:pageNo/:pageSize')
  @ApiDoc({
    summary: '获取媒体资源列表',
    description: '分页获取媒体资源列表。',
    query: MediaFilterSchema,
  })
  async getList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MediaFilterDto,
  ) {
    const res = await this.mediaService.getList(param, {
      userId: token.id,
      ...query,
    })
    this.processMediaFiles(res.list)
    return res
  }

  @ApiDoc({
    summary: '增加媒体使用次数',
    description: '批量增加媒体资源的使用次数。',
    body: AddUseCountOfListDto.schema,
  })
  @Put('addUseCountOfList')
  async addUseCountOfList(
    @GetToken() token: TokenInfo,
    @Body() body: AddUseCountOfListDto,
  ) {
    const res = await this.mediaService.addUseCountOfList(token.id, body.ids)
    return res
  }
}
