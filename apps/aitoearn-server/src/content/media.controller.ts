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
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { AddUseCountOfListDto, CreateMediaDto, MediaFilterDto, MediaIdsDto } from './dto/media.dto'
import { MediaService } from './media.service'

@ApiTags('媒体资源')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService,
  ) { }

  @ApiOperation({
    description: '创建媒体资源',
    summary: '创建媒体资源',
  })
  @Post()
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMediaDto,
  ) {
    const res = await this.mediaService.create(token.id, body)
    return res
  }

  @ApiOperation({
    description: '删除媒体资源',
    summary: '删除媒体资源',
  })
  @Delete('ids')
  async delByIds(@GetToken() token: TokenInfo, @Body() body: MediaIdsDto) {
    const res = await this.mediaService.delByIds(token.id, body.ids)
    return res
  }

  @ApiOperation({
    description: '删除媒体资源',
    summary: '删除媒体资源',
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
    description: '批量更新素材的使用次数',
    summary: '批量更新素材的使用次数',
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
