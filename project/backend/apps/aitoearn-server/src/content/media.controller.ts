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
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { Media } from '@yikart/mongodb'
import { fileUtil } from '../util/file.util'
import { AddUseCountOfListDto, CreateMediaDto, MediaFilterDto, MediaFilterSchema, MediaIdsDto } from './dto/media.dto'
import { MediaService } from './media.service'

@ApiTags('OpenSource/Me/Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  private processMediaFiles(mediaList: Media[]) {
    mediaList.forEach((media) => {
      media.url = fileUtil.buildUrl(media.url)
      media.thumbUrl = fileUtil.buildUrl(media.thumbUrl)
    })
  }

  @ApiDoc({
    summary: 'Create Media Asset',
    description: 'Create a media asset with metadata and file URLs.',
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
    summary: 'Delete Media Assets by IDs',
    description: 'Delete media assets using a list of IDs.',
    body: MediaIdsDto.schema,
  })
  @Delete('ids')
  async delByIds(@GetToken() token: TokenInfo, @Body() body: MediaIdsDto) {
    const res = await this.mediaService.delByIds(token.id, body.ids)
    return res
  }

  @ApiDoc({
    summary: 'Delete Media Assets by Filter',
    description: 'Delete media assets that match the filter criteria.',
    body: MediaFilterDto.schema,
  })
  @Delete('filter')
  async delByFilter(@GetToken() token: TokenInfo, @Body() body: MediaFilterDto) {
    const res = await this.mediaService.delByFilter(token.id, body)
    return res
  }

  @ApiDoc({
    summary: 'Delete Media Asset by ID',
    description: 'Delete a media asset by its identifier.',
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

  @Get('list/:pageNo/:pageSize')
  @ApiDoc({
    summary: 'List Media Assets',
    description: 'Retrieve a paginated list of media assets.',
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
    summary: 'Increase Media Usage Count',
    description: 'Increase the usage count of multiple media assets.',
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
