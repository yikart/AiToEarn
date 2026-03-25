import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, SkipResponseInterceptor, TableDto } from '@yikart/common'
import { Response } from 'express'
import { BilibiliWebhookSchema } from '../../publishing/bilibili-webhook.dto'
import { PublishingService } from '../../publishing/publishing.service'
import { AccountIdDto, ArchiveListDto, GetArchiveListDto, GetArcStatDto } from './bilibili.dto'
import { BilibiliService } from './bilibili.service'

@ApiTags('Platform/Bilibili')
@Controller('plat/bilibili')
export class BilibiliController {
  private readonly logger = new Logger(BilibiliController.name)
  constructor(
    private readonly bilibiliService: BilibiliService,
    private readonly publishingService: PublishingService,
  ) {}

  @Public()
  @SkipResponseInterceptor()
  @ApiDoc({
    summary: 'Handle Bilibili Webhook',
  })
  @Post('webhooks')
  async webhooks(@Body() body: unknown) {
    this.logger.log({ path: 'bilibili webhooks received', body })
    try {
      const dto = BilibiliWebhookSchema.parse(body)
      await this.publishingService.handleBilibiliPublishWebhook(dto)
      return { status: 'success', message: 'Webhook processed' }
    }
    catch (error) {
      this.logger.error(`Error handling Bilibili webhook: ${(error as Error).message}`, (error as Error).stack)
      throw new AppException(ResponseCode.ChannelWebhookFailed)
    }
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Bilibili OAuth Callback',
  })
  @Get('auth/back/:taskId')
  async getAccessToken(
    @Param('taskId') taskId: string,
    @Query() query: { code: string, state: string },
    @Res() res: Response,
  ) {
    const result = await this.bilibiliService.createAccountAndSetAccessToken(
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
    summary: 'Get Authorization URL',
  })
  @Get('auth/url/:type')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    return this.bilibiliService.createAuthTask({
      userId: token.id,
      type,
      spaceId: spaceId || '',
      callbackUrl,
      callbackMethod,
    })
  }

  @ApiDoc({
    summary: 'Get Authorization Callback Result',
  })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.bilibiliService.getAuthInfo(taskId)
  }

  @ApiDoc({
    summary: 'Check Account Authorization Status',
  })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.bilibiliService.getAccountAuthInfo(accountId)
  }

  @ApiDoc({
    summary: 'List Archive Categories',
  })
  @Get('archive/type/list/:accountId')
  async archiveTypeList(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.bilibiliService.archiveTypeList(accountId)
  }

  @ApiDoc({
    summary: 'List Archives',
    query: GetArchiveListDto.schema,
  })
  @Get('archive/list/:pageNo/:pageSize')
  async getArchiveList(
    @GetToken() token: TokenInfo,
    @Param() page: TableDto,
    @Query() query: GetArchiveListDto,
  ) {
    return this.bilibiliService.getArchiveList(query.accountId, {
      ps: page.pageSize,
      pn: page.pageNo!,
      status: query.status,
    })
  }

  @ApiDoc({
    summary: 'Get User Statistics',
  })
  @Get('stat/user/:accountId')
  async getUserStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.bilibiliService.getUserStat(accountId)
  }

  @ApiDoc({
    summary: 'Get Archive Statistics',
    query: GetArcStatDto.schema,
  })
  @Get('stat/arc')
  async getArcStat(
    @GetToken() token: TokenInfo,
    @Query() query: GetArcStatDto,
  ) {
    return this.bilibiliService.getArcStat(
      query.accountId,
      query.resourceId,
    )
  }

  @ApiDoc({
    summary: 'Get Archive Increment Statistics',
  })
  @Get('stat/inc/arc/:accountId')
  async getArcIncStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.bilibiliService.getArcIncStat(accountId)
  }

  @Public()
  @ApiDoc({
    summary: 'Get User Statistics (Crawler)',
    body: AccountIdDto.schema,
  })
  @Post('/userStat')
  async getCrawlerUserStat(@Body() data: AccountIdDto) {
    return this.bilibiliService.getUserStat(data.accountId)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Archive Statistics (Crawler)',
    body: GetArcStatDto.schema,
  })
  @Post('/arcStat')
  async getCrawlerArcStat(@Body() data: GetArcStatDto) {
    return this.bilibiliService.getArcStat(data.accountId, data.resourceId)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Archive List (Crawler)',
    body: ArchiveListDto.schema,
  })
  @Post('/archiveList')
  async getCrawlerArchiveList(@Body() data: ArchiveListDto) {
    return this.bilibiliService.getArchiveList(data.accountId, {
      ps: data.page.pageSize,
      pn: data.page.pageNo!,
      status: data.filter?.status,
    })
  }
}
