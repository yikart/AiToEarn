import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'

import {
  CreateQrCodeArtImageDto,
  CreateQrCodeArtImageDtoSchema,
  GenerateQrCodeArtDto,
  GenerateQrCodeArtDtoSchema,
  GetQrCodeArtTaskStatusDto,
  GetQrCodeArtTaskStatusDtoSchema,
  ListQrCodeArtImagesDto,
  ListQrCodeArtImagesDtoSchema,
} from './tools.dto'
import { ToolsService } from './tools.service'
import { QrCodeArtImageListVo, QrCodeArtImageVo, QrCodeArtTaskStatusVo, QrCodeArtVo } from './tools.vo'

@ApiTags('Tools/QR Code Art')
@Controller('tools')
export class ToolsController {
  constructor(
    private readonly toolsService: ToolsService,
  ) {}

  @ApiDoc({
    summary: '生成二维码艺术图',
    description: '根据二维码内容、参考样式图和提示词，使用 AI 异步生成美观的二维码艺术图',
    body: GenerateQrCodeArtDtoSchema,
    response: QrCodeArtVo,
  })
  @Post('/qrcode-art/generate')
  async generateQrCodeArt(
    @GetToken() token: TokenInfo,
    @Body() dto: GenerateQrCodeArtDto,
  ): Promise<QrCodeArtVo> {
    const result = await this.toolsService.generateQrCodeArt(token.id, dto)
    return QrCodeArtVo.create(result)
  }

  @ApiDoc({
    summary: '创建二维码艺术图记录',
    description: '将已生成的二维码艺术图存储为记录，关联到指定数据',
    body: CreateQrCodeArtImageDtoSchema,
    response: QrCodeArtImageVo,
  })
  @Post('/qrcode-art/images')
  async createQrCodeArtImage(
    @GetToken() token: TokenInfo,
    @Body() dto: CreateQrCodeArtImageDto,
  ): Promise<QrCodeArtImageVo> {
    const result = await this.toolsService.createQrCodeArtImage(token.id, dto)
    return QrCodeArtImageVo.create(result)
  }

  @ApiDoc({
    summary: '查询二维码艺术图列表',
    description: '根据关联数据 ID 和类型分页查询二维码艺术图',
    query: ListQrCodeArtImagesDtoSchema,
    response: QrCodeArtImageListVo,
  })
  @Get('/qrcode-art/images')
  async listQrCodeArtImagesWithPagination(
    @GetToken() token: TokenInfo,
    @Query() query: ListQrCodeArtImagesDto,
  ): Promise<QrCodeArtImageListVo> {
    const { list, total } = await this.toolsService.listQrCodeArtImagesByRelIdWithPagination(token.id, query)
    return new QrCodeArtImageListVo(list, total, query)
  }

  @ApiDoc({
    summary: '查询二维码艺术图详情',
    description: '根据 ID 查询二维码艺术图详情',
    response: QrCodeArtImageVo,
  })
  @Get('/qrcode-art/images/:id')
  async getQrCodeArtImageById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ): Promise<QrCodeArtImageVo> {
    const image = await this.toolsService.getQrCodeArtImageById(id, token.id)
    return QrCodeArtImageVo.create(image)
  }

  @ApiDoc({
    summary: '查询二维码艺术图生成任务状态',
    description: '根据任务日志 ID 查询二维码艺术图异步生成任务的状态和结果',
    query: GetQrCodeArtTaskStatusDtoSchema,
    response: QrCodeArtTaskStatusVo,
  })
  @Get('/qrcode-art/task/status')
  async getQrCodeArtTaskStatus(
    @GetToken() _token: TokenInfo,
    @Query() query: GetQrCodeArtTaskStatusDto,
  ): Promise<QrCodeArtTaskStatusVo> {
    const result = await this.toolsService.getQrCodeArtTaskStatus(query)
    return QrCodeArtTaskStatusVo.create(result as Parameters<typeof QrCodeArtTaskStatusVo.create>[0])
  }
}
