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
  Render,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
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

@ApiTags('plat/tiktok - TikTok平台')
@Controller('plat/tiktok')
export class TiktokController {
  constructor(
    private readonly tiktokService: TiktokService,
    private readonly platTiktokNatsApi: PlatTiktokNatsApi,
  ) {}

  @ApiOperation({ summary: '获取页面的认证URL' })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platTiktokNatsApi.getAuthUrl(token.id, data.scopes, data.spaceId || '')
    return res
  }

  @ApiOperation({ summary: '查询认证信息' })
  @Get('auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platTiktokNatsApi.getAuthInfo(taskId)
  }

  @Public()
  @UseGuards(OrgGuard)
  @ApiOperation({ summary: '创建账号并设置授权Token' })
  @Get('auth/back')
  @Render('auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.platTiktokNatsApi.createAccountAndSetAccessToken(
      data.code,
      data.state,
    )
  }

  @ApiOperation({ summary: '刷新访问令牌' })
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

  @ApiOperation({ summary: '撤销访问令牌' })
  @Post('auth/revoke-token/:accountId')
  async revokeAccessToken(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platTiktokNatsApi.revokeAccessToken(accountId)
  }

  @ApiOperation({ summary: '获取创作者信息' })
  @Get('creator/info/:accountId')
  async getCreatorInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platTiktokNatsApi.getCreatorInfo(accountId)
  }

  @ApiOperation({ summary: '检查账号状态' })
  @Get('account/status/:accountId')
  async checkAccountStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.tiktokService.checkAccountStatus(accountId)
  }

  @ApiOperation({ summary: '初始化视频发布' })
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

  @ApiOperation({ summary: '初始化照片发布' })
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

  @ApiOperation({ summary: '查询发布状态' })
  @Get('publish/status/:accountId/:publishId')
  async getPublishStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('publishId') publishId: string,
  ) {
    return this.platTiktokNatsApi.getPublishStatus(accountId, publishId)
  }

  @ApiOperation({
    summary: '上传视频文件',
    description: '上传视频文件到指定的上传URL',
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

  @ApiOperation({ summary: 'TikTok Webhook事件接收' })
  @Public()
  @Post('webhook')
  async handleWebhookEvent(
    @Body() event: any,
  ) {
    return this.tiktokService.handleWebhookEvent(event)
  }
}
