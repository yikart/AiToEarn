import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { BilibiliService } from './bilibili.service'
import {
  AccountIdDto,
  ArchiveListDto,
  CreateAccountAndSetAccessTokenDto,
  GetArcStatDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  GetHeaderDto,
} from './dto/bilibili.dto'

@ApiTags('OpenSource/Core/Platforms/Bilibili')
@Controller()
export class BilibiliController {
  constructor(private readonly bilibiliService: BilibiliService) { }

  @ApiDoc({
    summary: 'Get Bilibili Configuration',
  })
  @Get('config')
  async getBilibiliConfig() {
    return this.bilibiliService.getBilibiliConfig()
  }

  @ApiDoc({
    summary: 'Create Authorization Task',
    body: GetAuthUrlDto.schema,
  })
  @Post('plat/bilibili/auth')
  createAuthTask(@Body() data: GetAuthUrlDto) {
    const res = this.bilibiliService.createAuthTask({
      userId: data.userId,
      type: data.type,
      spaceId: data.spaceId,
    })
    return res
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
    body: GetAuthInfoDto.schema,
  })
  @Post('plat/bilibili/getAuthInfo')
  getAuthInfo(@Body() data: GetAuthInfoDto) {
    const res = this.bilibiliService.getAuthInfo(data.taskId)
    return res
  }

  @ApiDoc({
    summary: 'Get Account Authorization Info',
    body: AccountIdDto.schema,
  })
  @Post('plat/bilibili/getAccountAuthInfo')
  getAccountAuthInfo(@Body() data: AccountIdDto) {
    const res = this.bilibiliService.getAccountAuthInfo(data.accountId)
    return res
  }

  @ApiDoc({
    summary: 'Generate Authorization Header',
    body: GetHeaderDto.schema,
  })
  @Post('plat/bilibili/getHeader')
  async getHeader(@Body() data: GetHeaderDto) {
    const res = this.bilibiliService.generateHeader(data.accountId, {
      body: data.body,
      isForm: data.isForm,
    })
    return res
  }

  @ApiDoc({
    summary: 'Create Account and Set Access Token',
    body: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Post('plat/bilibili/createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Body() data: CreateAccountAndSetAccessTokenDto,
  ) {
    const res = await this.bilibiliService.createAccountAndSetAccessToken(
      data.taskId,
      {
        code: data.code,
        state: data.state,
      },
    )
    return res
  }

  @ApiDoc({
    summary: 'Get Authorized Scopes',
    body: AccountIdDto.schema,
  })
  @Post('bilibili/account/scopes')
  async getAccountScopes(@Body() data: AccountIdDto) {
    const res = await this.bilibiliService.getAccountScopes(data.accountId)
    return res
  }

  @ApiDoc({
    summary: 'List Archive Categories',
    body: AccountIdDto.schema,
  })
  @Post('plat/bilibili/archiveTypeList')
  async archiveTypeList(@Body() data: AccountIdDto) {
    return await this.bilibiliService.archiveTypeList(data.accountId)
  }

  @ApiDoc({
    summary: 'Get Archive List',
    body: ArchiveListDto.schema,
  })
  @Post('plat/bilibili/archiveList')
  async getArchiveList(@Body() data: ArchiveListDto) {
    return await this.bilibiliService.getArchiveList(data.accountId, {
      ps: data.page.pageSize,
      pn: data.page.pageNo!,
      status: data.filter.status,
    })
  }

  @ApiDoc({
    summary: 'Get User Statistics',
    body: AccountIdDto.schema,
  })
  @Post('plat/bilibili/userStat')
  async getUserStat(@Body() data: AccountIdDto) {
    return await this.bilibiliService.getUserStat(data.accountId)
  }

  @ApiDoc({
    summary: 'Get Archive Statistics',
    body: GetArcStatDto.schema,
  })
  @Post('plat/bilibili/arcStat')
  async getArcStat(@Body() data: GetArcStatDto) {
    return await this.bilibiliService.getArcStat(
      data.accountId,
      data.resourceId,
    )
  }

  @ApiDoc({
    summary: 'Get Archive Increment Stats',
    body: AccountIdDto.schema,
  })
  @Post('plat/bilibili/arcIncStat')
  async getArcIncStat(@Body() data: AccountIdDto) {
    return await this.bilibiliService.getArcIncStat(data.accountId)
  }

  @ApiDoc({
    summary: 'Get Access Token Status',
    body: AccountIdDto.schema,
  })
  @Post('plat/bilibili/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.bilibiliService.getAccessTokenStatus(data.accountId)
  }

  @ApiDoc({
    summary: 'Delete Archive',
  })
  @Delete(':accountId/archives/:archiveId')
  async deleteArchive(@Param() accountId: string, @Param() archiveId: string) {
    return await this.bilibiliService.deletePost(accountId, archiveId)
  }
}
