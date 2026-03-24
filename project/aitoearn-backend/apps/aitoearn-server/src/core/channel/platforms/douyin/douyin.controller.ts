import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { Response } from 'express'
import { DouyinWebhookSchema } from '../../publishing/douyin-webhook.dto'
import { PublishingService } from '../../publishing/publishing.service'
import { WebhookEvent } from './common'
import { CreateDouyinPublishDto, GenerateShareSchemaDto, GetArchiveListDto, GetArcStatDto } from './douyin.dto'
import { DouyinService } from './douyin.service'

@ApiTags('Platform/Douyin')
@Controller('plat/douyin')
export class DouyinController {
  private readonly logger = new Logger(DouyinController.name)

  constructor(
    private readonly douyinService: DouyinService,
    private readonly publishingService: PublishingService,
  ) {}

  @ApiDoc({
    summary: '抖音直接发布',
    body: CreateDouyinPublishDto.schema,
  })
  @Public()
  @Post('publish/create')
  async publishCreate(@Body() data: CreateDouyinPublishDto) {
    const publishResult = await this.publishingService.createDouyinPublishing({
      title: data.title,
      desc: data.desc,
      topics: data.topics,
      videoUrl: data.videoUrl,
      imgUrlList: data.imgUrlList,
    })
    await this.publishingService.createPublishRecord({
      accountId: data.accountId,
      accountType: AccountType.Douyin,
      taskId: data.taskId,
      materialId: data.materialId,
      materialGroupId: data.materialGroupId,
      title: data.title,
      desc: data.desc,
      // dataId: publishResult.shareId,
    })
    return publishResult.permalink
  }

  @Public()
  @Post('webhooks')
  async webhooks(
    @Body() body: any,
    @Res() res: any,
  ) {
    try {
      this.logger.log({
        path: 'douyin webhooks received',
        body,
      })

      if (body.event === WebhookEvent.VerifyWebhook) {
        res.setHeader('Content-Type', 'text/plain')
        const data = JSON.stringify({ challenge: body.content.challenge })
        this.logger.log({
          path: 'douyin webhooks verify',
          data,
        })
        res.send(data)
        return
      }

      if (body.event === WebhookEvent.PublishVideo) {
        res.setHeader('Content-Type', 'text/plain')
        this.logger.log(`Received Douyin publish webhook: ${JSON.stringify(body)}`)
        const dto = DouyinWebhookSchema.parse(body)
        await this.publishingService.handleDouyinPublishWebhook(dto)
        res.send(JSON.stringify({ status: 'success', message: 'Webhook processed' }))
        return
      }

      // Always ACK unknown events to avoid repeated retries from platform.
      this.logger.log({
        path: 'douyin webhooks ignored',
        event: body?.event,
      })
      res.send(JSON.stringify({ status: 'success', message: 'Event ignored' }))
    }
    catch (error) {
      this.logger.error(`Error handling Douyin webhook: ${(error as Error).message}`, (error as Error).stack)
      throw new AppException(ResponseCode.ChannelWebhookFailed)
    }
  }

  @ApiDoc({
    summary: 'Get Authorization URL',
  })
  @Get('auth/url')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    return this.douyinService.createAuthTask({
      userId: token.id,
      spaceId: spaceId || '',
      callbackUrl,
      callbackMethod,
    })
  }

  @Public()
  @Get('auth/back')
  async getAccessToken(
    @Query()
    query: {
      code: string
      state: string
    },
    @Res() res: Response,
  ) {
    const result = await this.douyinService.createAccountAndSetAccessToken(
      query.state,
      { code: query.code, state: query.state },
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
    summary: 'Get Authorization Callback Result',
  })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.douyinService.getAuthInfo(taskId)
  }

  @ApiDoc({
    summary: 'Generate Share Schema',
    body: GenerateShareSchemaDto.schema,
  })
  @Post('generateShareSchema')
  async generateShareSchema(
    @GetToken() token: TokenInfo,
    @Body() body: GenerateShareSchemaDto,
  ) {
    return this.douyinService.generateShareSchema({
      ...body.options,
      video_path: body.videoPath,
    })
  }

  @ApiDoc({
    summary: 'Check Account Authorization Status',
  })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.douyinService.getAccountAuthInfo(accountId)
  }

  @ApiDoc({
    summary: 'List Archive Categories',
  })
  @Get('/archive/type/list/:accountId')
  async archiveTypeList(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.douyinService.getArchiveTypeList(accountId)
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
    return this.douyinService.getArchiveList(query.accountId, {
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
    return this.douyinService.getUserStat(accountId)
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
    return this.douyinService.getArcStat(
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
    return this.douyinService.getArcIncStat(accountId)
  }
}
