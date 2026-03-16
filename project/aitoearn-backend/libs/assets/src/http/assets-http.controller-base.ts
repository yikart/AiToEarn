import type { Response } from 'express'
import { BadRequestException, Body, Get, Inject, Param, Post, Query, Res } from '@nestjs/common'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { AssetStatus } from '@yikart/mongodb'
import * as mime from 'mime-types'
import { AssetsService } from '../assets.service'
import { VideoMetadataService } from '../video-metadata.service'
import { AssetVo } from '../vo/asset.vo'
import { ThumbnailResultVo } from '../vo/thumbnail-result.vo'
import { UploadResultVo } from '../vo/upload-result.vo'
import { CreateUploadSignDto, GetThumbnailQueryDto, OssCallbackDto } from './assets-http.dto'
import { ASSETS_HTTP_OPTIONS, AssetsHttpModuleOptions } from './assets-http.options'

export abstract class AssetsHttpControllerBase {
  protected readonly userType: UserType

  constructor(
    protected readonly assetsService: AssetsService,
    protected readonly videoMetadataService: VideoMetadataService,
    @Inject(ASSETS_HTTP_OPTIONS) options: AssetsHttpModuleOptions,
  ) {
    this.userType = options.userType ?? UserType.User
  }

  @ApiDoc({
    summary: 'Create Upload Signed URL',
    description: 'Create a signed URL for direct upload. Path is auto-generated based on user and type.',
    body: CreateUploadSignDto.schema,
    response: UploadResultVo,
  })
  @Post('/uploadSign')
  async createUploadSign(
    @GetToken() token: TokenInfo,
    @Body() body: CreateUploadSignDto,
  ) {
    const mimeType = mime.lookup(body.filename) || 'application/octet-stream'
    const result = await this.assetsService.createUploadSign(token.id, {
      type: body.type,
      mimeType,
      filename: body.filename,
      size: body.size,
    }, this.userType)
    return UploadResultVo.create({
      id: result.asset.id,
      path: result.asset.path,
      url: result.url,
      uploadUrl: result.uploadUrl,
    })
  }

  @ApiDoc({
    summary: 'Confirm Asset Upload',
    description: 'Client confirms the asset upload after completing the upload to R2.',
    response: AssetVo,
  })
  @Post('/:id/confirm')
  async confirmUpload(
    @GetToken() token: TokenInfo,
    @Param('id') assetId: string,
  ) {
    const asset = await this.assetsService.confirmUploadByUser(token.id, assetId, this.userType)
    return AssetVo.create(Object.assign(asset, { url: asset.path }))
  }

  @ApiDoc({
    summary: 'Get Video Thumbnail',
    description: 'Get or extract thumbnail from a video by URL. If thumbnail already exists in metadata.cover, returns it directly. Otherwise extracts a new thumbnail.',
    query: GetThumbnailQueryDto.schema,
    response: ThumbnailResultVo,
  })
  @Get('/thumbnail')
  async getThumbnail(
    @GetToken() token: TokenInfo,
    @Query() query: GetThumbnailQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = this.assetsService.parsePathFromUrl(query.url)
    const asset = await this.assetsService.getOrCreateAssetByPath(path, token.id, this.userType)

    if (!asset.mimeType?.startsWith('video/')) {
      throw new BadRequestException('Asset is not a video')
    }

    const existingCover = (asset.metadata as { cover?: string } | undefined)?.cover
    if (existingCover) {
      const thumbnailUrl = this.assetsService.buildUrl(existingCover)
      if (query.redirect) {
        res.redirect(302, thumbnailUrl)
        return
      }
      return ThumbnailResultVo.create({ thumbnailUrl })
    }

    const result = await this.videoMetadataService.extractAndSaveThumbnail(
      asset,
      token.id,
      this.userType,
      { timeInSeconds: query.timeInSeconds },
    )

    if (query.redirect) {
      res.redirect(302, result.thumbnailUrl)
      return
    }

    return ThumbnailResultVo.create({ thumbnailUrl: result.thumbnailUrl })
  }

  @Public()
  @ApiDoc({
    summary: 'OSS Upload Callback',
    description: 'AliOss 上传完成后的服务端回调',
  })
  @Post('/oss/callback')
  async ossCallback(@Body() body: OssCallbackDto) {
    const asset = await this.assetsService.getById(body.assetId)
    if (asset && asset.status === AssetStatus.Pending) {
      await this.assetsService.confirmUpload({
        assetId: asset.id,
        size: body.size,
      })
    }
  }
}
