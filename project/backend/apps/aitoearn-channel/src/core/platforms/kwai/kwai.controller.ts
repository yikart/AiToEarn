import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AccountIdDto, CreateAccountAndSetAccessTokenDto, GetAuthInfoDto, GetAuthUrlDto, GetPohotListDto } from './dto/kwai.dto'
import { KwaiService } from './kwai.service'

@ApiTags('OpenSource/Core/Platforms/Kwai')
@Controller()
export class KwaiController {
  constructor(private readonly kwaiService: KwaiService) {}

  // 获取页面的认证URL
  // @NatsMessagePattern('plat.kwai.auth')
  @ApiDoc({
    summary: 'Create Authorization Task',
    body: GetAuthUrlDto.schema,
  })
  @Post('plat/kwai/auth')
  getAuthUrl(@Body() data: GetAuthUrlDto) {
    return this.kwaiService.createAuthTask(data)
  }

  // 查询认证信息
  // @NatsMessagePattern('plat.kwai.getAuthInfo')
  @ApiDoc({
    summary: 'Get Authorization Task Info',
    body: GetAuthInfoDto.schema,
  })
  @Post('plat/kwai/getAuthInfo')
  getAuthInfo(@Body() data: GetAuthInfoDto) {
    return this.kwaiService.getAuthInfo(data.taskId)
  }

  // 创建账号并设置授权Token
  // @NatsMessagePattern('plat.kwai.createAccountAndSetAccessToken')
  @ApiDoc({
    summary: 'Create Account and Set Access Token',
    body: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Post('plat/kwai/createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Body() data: CreateAccountAndSetAccessTokenDto,
  ) {
    const res = await this.kwaiService.createAccountAndSetAccessToken(
      data.taskId,
      {
        code: data.code,
        state: data.state,
      },
    )
    return res
  }

  // 获取用户公开信息
  // @NatsMessagePattern('plat.kwai.getAuthorInfo')
  @ApiDoc({
    summary: 'Get Author Information',
    body: AccountIdDto.schema,
  })
  @Post('plat/kwai/getAuthorInfo')
  getAuthorInfo(@Body() data: AccountIdDto) {
    return this.kwaiService.getAuthorInfo(data.accountId)
  }

  // 获取视频列表
  // @NatsMessagePattern('plat.kwai.getPhotoList')
  @ApiDoc({
    summary: 'List Published Videos',
    body: GetPohotListDto.schema,
  })
  @Post('plat/kwai/getPhotoList')
  fetchVideoList(@Body() data: GetPohotListDto) {
    return this.kwaiService.fetchVideoList(data.accountId, data?.cursor, data?.count)
  }

  // @NatsMessagePattern('plat.kwai.accessTokenStatus')
  @ApiDoc({
    summary: 'Get Access Token Status',
    body: AccountIdDto.schema,
  })
  @Post('plat/kwai/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.kwaiService.getAccessTokenStatus(data.accountId)
  }
}
