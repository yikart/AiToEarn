/*
 * @Author: AI Assistant
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: AI Assistant
 * @Description: TikTok Platform Controller
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatTiktokNatsApi } from '../../transports/channel/api/tiktok.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthUrlDto,
  PhotoPublishDto,
  RefreshTokenDto,
  UploadVideoFileDto,
  VideoPublishDto,
} from './dto/tiktok.dto'
import { TiktokService } from './tiktok.service'

@ApiTags('OpenSource/Platform/Tiktok')
@Controller('plat/tiktok')
export class TiktokController {
  constructor(
    private readonly tiktokService: TiktokService,
    private readonly platTiktokNatsApi: PlatTiktokNatsApi,
  ) {}

  @ApiDoc({
    summary: 'Get TikTok Authorization URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platTiktokNatsApi.getAuthUrl(token.id, data.scopes, data.spaceId || '')
    return res
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Get('auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platTiktokNatsApi.getAuthInfo(taskId)
  }

  @Public()
  @UseGuards(OrgGuard)
  @ApiDoc({
    summary: 'Handle TikTok OAuth Callback',
    query: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Get('auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.platTiktokNatsApi.createAccountAndSetAccessToken(
      data.code,
      data.state,
    )
    return res.render('auth/back', result)
  }

  @ApiDoc({
    summary: 'Refresh Access Token',
    body: RefreshTokenDto.schema,
  })
  @Post('auth/refresh-token')
  async refreshAccessToken(
    @GetToken() token: TokenInfo,
    @Body() data: RefreshTokenDto,
  ) {
    return this.platTiktokNatsApi.refreshAccessToken(
      data.accountId,
      data.refreshToken,
    )
  }

  @ApiDoc({
    summary: 'Revoke Access Token',
  })
  @Post('auth/revoke-token/:accountId')
  async revokeAccessToken(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platTiktokNatsApi.revokeAccessToken(accountId)
  }

  @ApiDoc({
    summary: 'Get Creator Information',
  })
  @Get('creator/info/:accountId')
  async getCreatorInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platTiktokNatsApi.getCreatorInfo(accountId)
  }

  @ApiDoc({
    summary: 'Check Account Status',
  })
  @Get('account/status/:accountId')
  async checkAccountStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.tiktokService.checkAccountStatus(accountId)
  }

  @ApiDoc({
    summary: 'Initialize Video Publish',
    body: VideoPublishDto.schema,
  })
  @Post('publish/video/init')
  async initVideoPublish(
    @GetToken() token: TokenInfo,
    @Body() data: VideoPublishDto,
  ) {
    return this.platTiktokNatsApi.initVideoPublish(
      data.accountId,
      data.postInfo,
      data.sourceInfo,
    )
  }

  @ApiDoc({
    summary: 'Initialize Photo Publish',
    body: PhotoPublishDto.schema,
  })
  @Post('publish/photo/init')
  async initPhotoPublish(
    @GetToken() token: TokenInfo,
    @Body() data: PhotoPublishDto,
  ) {
    return this.platTiktokNatsApi.initPhotoPublish(
      data.accountId,
      data.postMode,
      data.postInfo,
      data.sourceInfo,
    )
  }

  @ApiDoc({
    summary: 'Get Publish Status',
  })
  @Get('publish/status/:accountId/:publishId')
  async getPublishStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('publishId') publishId: string,
  ) {
    return this.platTiktokNatsApi.getPublishStatus(accountId, publishId)
  }

  @ApiDoc({
    summary: 'Upload Video File',
    description: 'Upload a video file to the specified upload URL.',
    body: UploadVideoFileDto.schema,
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload/video')
  async uploadVideoFile(
    @GetToken() token: TokenInfo,
    @UploadedFile() file: any,
    @Body() body: UploadVideoFileDto,
  ) {
    return this.tiktokService.uploadVideoFile(
      body.uploadUrl,
      file,
      body.contentType,
    )
  }

  @ApiDoc({
    summary: 'Handle TikTok Webhook Event',
  })
  @Public()
  @Post('webhook')
  async handleWebhookEvent(
    @Body() event: any,
  ) {
    return this.tiktokService.handleWebhookEvent(event)
  }
}
