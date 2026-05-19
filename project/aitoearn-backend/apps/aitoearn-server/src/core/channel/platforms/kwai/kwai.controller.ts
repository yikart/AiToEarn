import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Internal, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { MetricEventHelperService, MetricEventName } from '@yikart/helpers'
import { Response } from 'express'
import {
  AccountIdDto,
  GetPohotListDto,
  GetVideoInfoDto,
} from './kwai.dto'
import { KwaiService } from './kwai.service'

@ApiTags('Platform/Kwai')
@Controller('plat/kwai')
export class KwaiController {
  constructor(
    private readonly kwaiService: KwaiService,
    private readonly metricEventHelperService: MetricEventHelperService,
  ) {}

  @ApiDoc({
    summary: 'Create Authorization Task',
  })
  @Get('auth/url/:type')
  async getAuth(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    const result = await this.kwaiService.createAuthTask({
      userId: token.id,
      type,
      spaceId: spaceId || '',
      callbackUrl,
      callbackMethod,
    })

    if (result?.taskId) {
      await this.metricEventHelperService.record(token.id, MetricEventName.aiPublishAddChannels, {
        bizKey: result.taskId,
        properties: { platform: 'kwai' },
      })
    }

    return result
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.kwaiService.getAuthInfo(taskId)
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Kwai OAuth Callback',
  })
  @Get('auth/back/:taskId')
  async getAccessToken(
    @Param('taskId') taskId: string,
    @Query() query: { code: string, state: string },
    @Res() res: Response,
  ) {
    const result = await this.kwaiService.createAccountAndSetAccessToken(
      taskId,
      query,
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
    summary: 'Get Author Information',
    body: AccountIdDto.schema,
  })
  @Post('auth/info')
  async getAuthorInfo(@GetToken() token: TokenInfo, @Body() data: AccountIdDto) {
    return this.kwaiService.getAuthorInfo(token.id, data.accountId)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Author Info (Crawler)',
    body: AccountIdDto.schema,
  })
  @Post('/getAuthorInfo')
  async getCrawlerAuthorInfo(@Body() data: AccountIdDto) {
    return this.kwaiService.getAuthorInfoByAccountId(data.accountId)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Photo List (Crawler)',
    body: GetPohotListDto.schema,
  })
  @Post('/getPhotoList')
  async getPhotoList(@Body() data: GetPohotListDto) {
    return this.kwaiService.fetchVideoList(data.accountId, data.cursor, data.count)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Video Info (Crawler)',
    body: GetVideoInfoDto.schema,
  })
  @Post('/getVideoInfo')
  async getVideoInfo(@Body() data: GetVideoInfoDto) {
    return this.kwaiService.getVideoInfo(data.accountId, data.photoId)
  }
}
