import { TableDto } from '@common/dto/table.dto'
import { OrgGuard } from '@common/interceptor/transform.interceptor'
/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountNatsApi } from '@transports/account/account.natsApi'
import { AddArchiveData } from '@transports/channel/bilibili.common'
import { PlatBilibiliNatsApi } from '@transports/channel/bilibili.natsApi'
import { GetToken, Public } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { BilibiliService } from './bilibili.service'
import {
  ArchiveAddByUtokenBodyDto,
  GetArchiveListDto,
  GetArcStatDto,
  UploadLitVideoDto,
  UploadVideoPartDto,
  VideoCompleteDto,
  VideoInitDto,
} from './dto/bilibili.dto'

@ApiTags('plat/bilibili - B站平台')
@Controller('plat/bilibili')
export class BilibiliController {
  constructor(
    private readonly bilibiliService: BilibiliService,
    private readonly accountNatsApi: AccountNatsApi,
    private readonly platBilibiliNatsApi: PlatBilibiliNatsApi,
  ) {}

  // 授权回调，创建账号
  @Public()
  @UseGuards(OrgGuard)
  @Get('auth/back/:taskId')
  async getAccessToken(
    @Param('taskId') taskId: string,
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    await this.platBilibiliNatsApi.createAccountAndSetAccessToken({
      taskId,
      ...query,
    })
  }

  @ApiOperation({ summary: '获取页面的认证URL' })
  @Get('auth/url/:type')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
  ) {
    const res = await this.platBilibiliNatsApi.getAuth(token.id, type)
    return res
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platBilibiliNatsApi.getAuthInfo(taskId)
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.bilibiliService.checkAccountAuthStatus(accountId)
  }

  @ApiOperation({ summary: '视频初始化' })
  @Public()
  @Post('video/init')
  async videoInit(@Body() data: VideoInitDto) {
    return this.platBilibiliNatsApi.videoInit(data.accountId, data.name, 0)
  }

  @ApiOperation({ summary: '上传视频分片' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('video/part/upload/:accountId')
  async uploadVideoPart(
    @UploadedFile() file: Express.Multer.File,
    @Param('accountId') accountId: string,
    @Query() query: UploadVideoPartDto,
  ) {
    return this.bilibiliService.uploadVideoPart(
      accountId,
      file,
      query.uploadToken,
      query.partNumber,
    )
  }

  @ApiOperation({ summary: '视频分片合并' })
  @Post('video/complete/:accountId')
  async videoComplete(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Body() body: VideoCompleteDto,
  ) {
    return this.bilibiliService.videoComplete(accountId, body.uploadToken)
  }

  @ApiOperation({ summary: '封面上传' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('cover/upload/:accountId')
  async coverUpload(
    @GetToken() token: TokenInfo,
    @UploadedFile() file: Express.Multer.File,
    @Param('accountId') accountId: string,
  ) {
    return this.bilibiliService.coverUpload(accountId, file)
  }

  @ApiOperation({
    summary: '上传小视频（注意）',
    description: '因微服务nats传输限制，只允许20M以下文件',
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('video/upload/:accountId')
  async uploadLitVideo(
    @UploadedFile() file: Express.Multer.File,
    @Param('accountId') accountId: string,
    @Body() body: UploadLitVideoDto,
  ) {
    return this.bilibiliService.uploadLitVideo(
      accountId,
      file,
      body.uploadToken,
    )
  }

  @ApiOperation({ summary: '视频稿件提交' })
  @Post('archive/add-by-utoken')
  async archiveAddByUtoken(
    @GetToken() token: TokenInfo,
    @Body() body: ArchiveAddByUtokenBodyDto,
  ) {
    const optData: AddArchiveData = {
      title: body.title,
      cover: body.cover,
      tid: body.tid,
      no_reprint: body.noReprint,
      desc: body.desc,
      copyright: body.copyright,
      source: body.source,
      // topic_id: body.topicId,
    }

    console.log(
      '------ archiveAddByUtoken ------',
      body.accountId,
      body.uploadToken,
      optData,
    )

    return this.platBilibiliNatsApi.archiveAddByUtoken(
      body.accountId,
      body.uploadToken,
      optData,
    )
  }

  @ApiOperation({ summary: '分区查询' })
  @Get('archive/type/list/:accountId')
  async archiveTypeList(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliNatsApi.archiveTypeList(accountId)
  }

  @ApiOperation({ summary: '获取稿件列表' })
  @Get('archive/list/:pageNo/:pageSize')
  async getArchiveList(
    @GetToken() token: TokenInfo,
    @Param() page: TableDto,
    @Query() query: GetArchiveListDto,
  ) {
    return this.platBilibiliNatsApi.getArchiveList(query.accountId, page, {
      status: query.status,
    })
  }

  @ApiOperation({ summary: '获取用户数据' })
  @Get('stat/user/:accountId')
  async getUserStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliNatsApi.getUserStat(accountId)
  }

  @ApiOperation({ summary: '获取稿件数据' })
  @Get('stat/arc')
  async getArcStat(
    @GetToken() token: TokenInfo,
    @Query() query: GetArcStatDto,
  ) {
    return this.platBilibiliNatsApi.getArcStat(
      query.accountId,
      query.resourceId,
    )
  }

  @ApiOperation({ summary: '获取稿件增量数据数据' })
  @Get('stat/inc/arc/:accountId')
  async getArcIncStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliNatsApi.getArcIncStat(accountId)
  }
}
