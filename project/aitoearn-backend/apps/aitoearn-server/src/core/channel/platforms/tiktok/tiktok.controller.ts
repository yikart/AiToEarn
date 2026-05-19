import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Internal, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, SkipResponseInterceptor } from '@yikart/common'
import { MetricEventHelperService, MetricEventName } from '@yikart/helpers'
import { Response } from 'express'
import { PublishingService } from '../../publishing/publishing.service'
import { TiktokWebhookSchema } from '../../publishing/tiktok-webhook.dto'
import {
  CreateAccountAndSetAccessTokenDto,
  FileUploadBodyDto,
  GetAuthUrlDto,
  ListUserVideosDto,
  PhotoPublishDto,
  RefreshTokenDto,
  UserInfoDto,
  VideoPublishDto,
} from './tiktok.dto'
import { TiktokService } from './tiktok.service'

@ApiTags('Platform/Tiktok')
@Controller('plat/tiktok')
export class TiktokController {
  private readonly logger = new Logger(TiktokController.name)

  constructor(
    private readonly tiktokService: TiktokService,
    private readonly publishingService: PublishingService,
    private readonly metricEventHelperService: MetricEventHelperService,
  ) {}

  @ApiDoc({
    summary: 'Get TikTok Authorization URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('/auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const result = await this.tiktokService.getAuthUrl({
      userId: token.id,
      scopes: data.scopes,
      spaceId: data.spaceId,
      callbackUrl: data.callbackUrl,
      callbackMethod: data.callbackMethod,
    })

    if (result?.taskId) {
      await this.metricEventHelperService.record(token.id, MetricEventName.aiPublishAddChannels, {
        bizKey: result.taskId,
        properties: { platform: 'tiktok' },
      })
    }

    return result
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Get('/auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return await this.tiktokService.getAuthInfo(taskId)
  }

  @Public()
  @ApiDoc({
    summary: 'Handle TikTok OAuth Callback',
    query: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Get('/auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.tiktokService.createAccountAndSetAccessToken(
      data.state,
      { code: data.code, state: data.state },
    )

    if (result.status === 1 && result.callbackUrl) {
      return res.render('auth/back', {
        ...result,
        autoPostCallback: true,
      })
    }

    return res.render('auth/back', result)
  }

  @ApiDoc({
    summary: 'Refresh Access Token',
    body: RefreshTokenDto.schema,
  })
  @Post('/auth/refresh-token')
  async refreshAccessToken(
    @GetToken() token: TokenInfo,
    @Body() data: RefreshTokenDto,
  ) {
    return await this.tiktokService.refreshAccessToken(
      token.id,
      data.accountId,
      data.refreshToken,
    )
  }

  @ApiDoc({
    summary: 'Revoke Access Token',
  })
  @Post('/auth/revoke-token/:accountId')
  async revokeAccessToken(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.tiktokService.revokeAccessToken(token.id, accountId)
  }

  @ApiDoc({
    summary: 'Get Creator Information',
  })
  @Get('/creator/info/:accountId')
  async getCreatorInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.tiktokService.getCreatorInfo(token.id, accountId)
  }

  @ApiDoc({
    summary: 'Check Account Status',
  })
  @Get('/account/status/:accountId')
  async getAccountStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.tiktokService.getAccessTokenStatus(accountId)
  }

  @ApiDoc({
    summary: 'Initialize Video Publish',
    body: VideoPublishDto.schema,
  })
  @Post('/publish/video/init')
  async initVideoPublish(
    @GetToken() token: TokenInfo,
    @Body() data: VideoPublishDto,
  ) {
    return await this.tiktokService.initVideoPublish(
      token.id,
      data.accountId,
      data.postInfo,
      data.sourceInfo,
    )
  }

  @ApiDoc({
    summary: 'Initialize Photo Publish',
    body: PhotoPublishDto.schema,
  })
  @Post('/publish/photo/init')
  async initPhotoPublish(
    @GetToken() token: TokenInfo,
    @Body() data: PhotoPublishDto,
  ) {
    return await this.tiktokService.initPhotoPublish(
      token.id,
      data.accountId,
      data.postMode,
      data.postInfo,
      data.sourceInfo,
    )
  }

  @ApiDoc({
    summary: 'Get Publish Status',
  })
  @Get('/publish/status/:accountId/:publishId')
  async getPublishStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('publishId') publishId: string,
  ) {
    return await this.tiktokService.getPublishStatus(token.id, accountId, publishId)
  }

  @ApiDoc({
    summary: 'Upload Video File',
    description: 'Upload a video file to the specified upload URL.',
    body: FileUploadBodyDto.schema,
  })
  @UseInterceptors(FileInterceptor('video'))
  @Post('/upload/video')
  async uploadVideoFile(
    @GetToken() token: TokenInfo,
    @UploadedFile() file: { buffer: Buffer },
    @Body() body: FileUploadBodyDto,
  ) {
    const base64 = file.buffer.toString('base64')
    return await this.tiktokService.uploadVideoFile(
      body.uploadUrl,
      base64,
      body.contentType,
    )
  }

  @Public()
  @SkipResponseInterceptor()
  @ApiDoc({
    summary: 'Handle TikTok Webhook Event',
  })
  @Post('/webhook')
  async handleWebhookEvent(@Body() event: unknown) {
    this.logger.log({ path: 'tiktok webhook', data: event })
    const dto = TiktokWebhookSchema.parse(event)
    await this.publishingService.handleTiktokPostWebhook(dto)
    return { status: 'success', message: 'Webhook processed' }
  }

  @Internal()
  @ApiDoc({
    summary: 'Get User Info (Crawler)',
    body: UserInfoDto.schema,
  })
  @Post('/user/info')
  async getUserInfo(@Body() data: UserInfoDto) {
    return await this.tiktokService.getUserInfo(data.accountId, data.fields)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get User Videos (Crawler)',
    body: ListUserVideosDto.schema,
  })
  @Post('/user/videos')
  async getUserVideos(@Body() data: ListUserVideosDto) {
    return await this.tiktokService.getUserVideos(data.accountId, data.fields, data.cursor, data.max_count)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get User Timeline (Crawler)',
    body: ListUserVideosDto.schema,
  })
  @Post('/timeline')
  async getUserTimeline(@Body() data: ListUserVideosDto) {
    return await this.tiktokService.getUserVideos(data.accountId, data.fields, data.cursor, data.max_count)
  }
}
